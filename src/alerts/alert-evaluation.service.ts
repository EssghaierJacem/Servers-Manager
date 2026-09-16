import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { CryptoService } from '../crypto/crypto.service';
import { buildTransitionCondition } from './alert-condition-builder';
import { buildAlertMessage } from './alert-message.builder';
import { ChannelAdapter } from './channels/channel-adapter.interface';
import { SlackChannelAdapter } from './channels/slack-channel.adapter';
import { EmailChannelAdapter } from './channels/email-channel.adapter';
import { AlertLog, AlertDeliveryStatus } from './entities/alert-log.entity';
import { AlertChannel, AlertEntityType, AlertRule } from './entities/alert-rule.entity';

export interface EvaluateTransitionInput {
  orgId: string;
  entityType: AlertEntityType;
  entityId: string;
  previousStatus: string;
  newStatus: string;
}

export interface EvaluateDirectConditionInput {
  orgId: string;
  entityType: AlertEntityType;
  entityId: string;
  condition: string;
  message: string;
}

/**
 * The single place rule-matching, cooldown, and delivery happen. Every
 * public method here is defensively wrapped so a problem evaluating or
 * delivering an alert can never propagate back into the health check /
 * domain check / service sync / rollback job that called it.
 */
@Injectable()
export class AlertEvaluationService {
  private readonly logger = new Logger(AlertEvaluationService.name);

  constructor(
    @InjectRepository(AlertRule)
    private readonly alertRuleRepository: Repository<AlertRule>,
    @InjectRepository(AlertLog)
    private readonly alertLogRepository: Repository<AlertLog>,
    private readonly cryptoService: CryptoService,
    private readonly slackAdapter: SlackChannelAdapter,
    private readonly emailAdapter: EmailChannelAdapter,
  ) {}

  /**
   * Called from the end of a status-carrying check (host health, SSL
   * check, service sync, rollback job). No-ops if the status didn't
   * actually change, or if this entity type has no transition condition
   * scheme (see buildTransitionCondition).
   */
  async evaluateTransition(input: EvaluateTransitionInput): Promise<void> {
    try {
      if (input.previousStatus === input.newStatus) {
        return;
      }

      const condition = buildTransitionCondition(input.entityType, input.newStatus);
      if (!condition) {
        return;
      }

      const message = buildAlertMessage({
        entityType: input.entityType,
        entityId: input.entityId,
        condition,
        previousStatus: input.previousStatus,
        newStatus: input.newStatus,
      });

      await this.dispatch(input.orgId, input.entityType, input.entityId, condition, message);
    } catch (error) {
      this.logger.error(`evaluateTransition failed unexpectedly: ${(error as Error).message}`);
    }
  }

  /**
   * Called for conditions that aren't a before/after status transition -
   * currently the system:idle_host_detected / system:orphan_detected
   * insights, dispatched by InsightsService with an already-built message.
   */
  async evaluateDirectCondition(input: EvaluateDirectConditionInput): Promise<void> {
    try {
      await this.dispatch(
        input.orgId,
        input.entityType,
        input.entityId,
        input.condition,
        input.message,
      );
    } catch (error) {
      this.logger.error(`evaluateDirectCondition failed unexpectedly: ${(error as Error).message}`);
    }
  }

  private async dispatch(
    orgId: string,
    entityType: AlertEntityType,
    entityId: string,
    condition: string,
    message: string,
  ): Promise<void> {
    const rules = await this.alertRuleRepository.find({
      where: { orgId, entityType, condition, enabled: true },
    });

    for (const rule of rules) {
      await this.evaluateRule(rule, entityId, message);
    }
  }

  private async evaluateRule(rule: AlertRule, entityId: string, message: string): Promise<void> {
    try {
      const withinCooldown = await this.isWithinCooldown(rule, entityId);
      if (withinCooldown) {
        this.logger.debug(
          `Skipping alert for rule ${rule.id} (entity ${entityId}): within cooldown`,
        );
        return;
      }

      const channelConfig = JSON.parse(
        this.cryptoService.decrypt(rule.channelConfigEncrypted),
      ) as Record<string, unknown>;

      const adapter = this.getAdapter(rule.channel);
      const result = await adapter.send(message, channelConfig);

      await this.writeLog(rule, entityId, message, result.success, result.error ?? null);
    } catch (error) {
      // A broken channel config, an unhandled adapter throw, anything -
      // this must never bubble up into the caller's job.
      await this.writeLog(rule, entityId, message, false, (error as Error).message);
    }
  }

  private async isWithinCooldown(rule: AlertRule, entityId: string): Promise<boolean> {
    const cutoff = new Date(Date.now() - rule.cooldownMinutes * 60_000);
    const recentSend = await this.alertLogRepository.findOne({
      where: {
        alertRuleId: rule.id,
        entityId,
        deliveryStatus: AlertDeliveryStatus.SENT,
        firedAt: MoreThan(cutoff),
      },
    });
    return recentSend !== null;
  }

  private async writeLog(
    rule: AlertRule,
    entityId: string,
    message: string,
    success: boolean,
    error: string | null,
  ): Promise<void> {
    try {
      await this.alertLogRepository.save(
        this.alertLogRepository.create({
          alertRuleId: rule.id,
          entityType: rule.entityType,
          entityId,
          message,
          deliveryStatus: success ? AlertDeliveryStatus.SENT : AlertDeliveryStatus.FAILED,
          error,
        }),
      );
    } catch (logError) {
      this.logger.error(
        `Failed to write AlertLog for rule ${rule.id}: ${(logError as Error).message}`,
      );
    }
  }

  private getAdapter(channel: AlertChannel): ChannelAdapter {
    switch (channel) {
      case AlertChannel.SLACK:
        return this.slackAdapter;
      case AlertChannel.EMAIL:
        return this.emailAdapter;
    }
  }
}
