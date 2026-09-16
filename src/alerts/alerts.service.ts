import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoService } from '../crypto/crypto.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';
import { ListAlertLogsQueryDto } from './dto/list-alert-logs-query.dto';
import { AlertRule } from './entities/alert-rule.entity';
import { AlertLog } from './entities/alert-log.entity';

const ALERT_LOGS_LIST_LIMIT = 100;

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertRule)
    private readonly alertRuleRepository: Repository<AlertRule>,
    @InjectRepository(AlertLog)
    private readonly alertLogRepository: Repository<AlertLog>,
    private readonly cryptoService: CryptoService,
  ) {}

  async create(orgId: string, dto: CreateAlertRuleDto): Promise<AlertRule> {
    const rule = this.alertRuleRepository.create({
      orgId,
      name: dto.name,
      entityType: dto.entity_type,
      condition: dto.condition,
      channel: dto.channel,
      channelConfigEncrypted: this.encryptConfig(dto.channel_config),
      cooldownMinutes: dto.cooldown_minutes,
      enabled: dto.enabled,
    });
    return this.alertRuleRepository.save(rule);
  }

  findAllForOrg(orgId: string): Promise<AlertRule[]> {
    return this.alertRuleRepository.find({ where: { orgId }, order: { createdAt: 'DESC' } });
  }

  async findOneForOrgOrThrow(orgId: string, id: string): Promise<AlertRule> {
    const rule = await this.alertRuleRepository.findOne({ where: { id, orgId } });
    if (!rule) {
      throw new NotFoundException(`Alert rule ${id} not found`);
    }
    return rule;
  }

  async update(orgId: string, id: string, dto: UpdateAlertRuleDto): Promise<AlertRule> {
    const rule = await this.findOneForOrgOrThrow(orgId, id);

    if (dto.name !== undefined) rule.name = dto.name;
    if (dto.entity_type !== undefined) rule.entityType = dto.entity_type;
    if (dto.condition !== undefined) rule.condition = dto.condition;
    if (dto.channel !== undefined) rule.channel = dto.channel;
    if (dto.channel_config !== undefined)
      rule.channelConfigEncrypted = this.encryptConfig(dto.channel_config);
    if (dto.cooldown_minutes !== undefined) rule.cooldownMinutes = dto.cooldown_minutes;
    if (dto.enabled !== undefined) rule.enabled = dto.enabled;

    return this.alertRuleRepository.save(rule);
  }

  async remove(orgId: string, id: string): Promise<void> {
    const rule = await this.findOneForOrgOrThrow(orgId, id);
    await this.alertRuleRepository.remove(rule);
  }

  findLogsForOrg(orgId: string, query: ListAlertLogsQueryDto): Promise<AlertLog[]> {
    const qb = this.alertLogRepository
      .createQueryBuilder('log')
      .innerJoin('log.alertRule', 'rule')
      .where('rule.org_id = :orgId', { orgId });

    if (query.alert_rule_id) {
      qb.andWhere('log.alertRuleId = :alertRuleId', { alertRuleId: query.alert_rule_id });
    }
    if (query.entity_type) {
      qb.andWhere('log.entityType = :entityType', { entityType: query.entity_type });
    }

    return qb.orderBy('log.firedAt', 'DESC').take(ALERT_LOGS_LIST_LIMIT).getMany();
  }

  private encryptConfig(config: Record<string, unknown>): string {
    return this.cryptoService.encrypt(JSON.stringify(config));
  }
}
