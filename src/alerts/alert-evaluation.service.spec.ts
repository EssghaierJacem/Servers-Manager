import { CryptoService } from '../crypto/crypto.service';
import { SlackChannelAdapter } from './channels/slack-channel.adapter';
import { EmailChannelAdapter } from './channels/email-channel.adapter';
import { AlertEvaluationService } from './alert-evaluation.service';
import { AlertDeliveryStatus } from './entities/alert-log.entity';
import { AlertChannel, AlertEntityType, AlertRule } from './entities/alert-rule.entity';

function makeRule(overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id: 'rule-1',
    orgId: 'org-1',
    name: 'Test rule',
    entityType: AlertEntityType.HOST,
    condition: 'host_status_transitioned_to:unreachable',
    channel: AlertChannel.SLACK,
    channelConfigEncrypted: 'encrypted-blob',
    cooldownMinutes: 30,
    enabled: true,
    createdAt: new Date(),
    ...overrides,
  } as AlertRule;
}

describe('AlertEvaluationService', () => {
  let alertRuleRepository: { find: jest.Mock };
  let alertLogRepository: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let cryptoService: { decrypt: jest.Mock };
  let slackAdapter: { send: jest.Mock };
  let emailAdapter: { send: jest.Mock };
  let service: AlertEvaluationService;

  beforeEach(() => {
    alertRuleRepository = { find: jest.fn() };
    alertLogRepository = {
      findOne: jest.fn(),
      create: jest.fn((input) => input),
      save: jest.fn((input) => Promise.resolve({ id: 'log-1', ...input })),
    };
    cryptoService = {
      decrypt: jest.fn(() => JSON.stringify({ webhook_url: 'https://example.com/hook' })),
    };
    slackAdapter = { send: jest.fn() };
    emailAdapter = { send: jest.fn() };

    service = new AlertEvaluationService(
      alertRuleRepository as never,
      alertLogRepository as never,
      cryptoService as unknown as CryptoService,
      slackAdapter as unknown as SlackChannelAdapter,
      emailAdapter as unknown as EmailChannelAdapter,
    );
  });

  describe('evaluateTransition', () => {
    it('does nothing when the status has not changed', async () => {
      await service.evaluateTransition({
        orgId: 'org-1',
        entityType: AlertEntityType.HOST,
        entityId: 'host-1',
        previousStatus: 'healthy',
        newStatus: 'healthy',
      });

      expect(alertRuleRepository.find).not.toHaveBeenCalled();
    });

    it('does nothing for an entity type with no transition condition scheme', async () => {
      await service.evaluateTransition({
        orgId: 'org-1',
        entityType: AlertEntityType.DOMAIN,
        entityId: 'domain-1',
        previousStatus: 'unknown',
        newStatus: 'not_resolving',
      });

      expect(alertRuleRepository.find).not.toHaveBeenCalled();
    });

    it('sends and logs a sent AlertLog when a matching enabled rule exists and no rule is in cooldown', async () => {
      const rule = makeRule();
      alertRuleRepository.find.mockResolvedValue([rule]);
      alertLogRepository.findOne.mockResolvedValue(null);
      slackAdapter.send.mockResolvedValue({ success: true });

      await service.evaluateTransition({
        orgId: 'org-1',
        entityType: AlertEntityType.HOST,
        entityId: 'host-1',
        previousStatus: 'healthy',
        newStatus: 'unreachable',
      });

      expect(alertRuleRepository.find).toHaveBeenCalledWith({
        where: {
          orgId: 'org-1',
          entityType: AlertEntityType.HOST,
          condition: 'host_status_transitioned_to:unreachable',
          enabled: true,
        },
      });
      expect(slackAdapter.send).toHaveBeenCalledTimes(1);
      expect(alertLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ deliveryStatus: AlertDeliveryStatus.SENT, error: null }),
      );
    });

    it('skips sending when a sent log exists within the cooldown window', async () => {
      const rule = makeRule({ cooldownMinutes: 30 });
      alertRuleRepository.find.mockResolvedValue([rule]);
      alertLogRepository.findOne.mockResolvedValue({ id: 'previous-log' });

      await service.evaluateTransition({
        orgId: 'org-1',
        entityType: AlertEntityType.HOST,
        entityId: 'host-1',
        previousStatus: 'healthy',
        newStatus: 'unreachable',
      });

      expect(slackAdapter.send).not.toHaveBeenCalled();
      expect(alertLogRepository.save).not.toHaveBeenCalled();
    });

    it('fires again once the cooldown query finds no recent sent log (cooldown expired)', async () => {
      const rule = makeRule({ cooldownMinutes: 30 });
      alertRuleRepository.find.mockResolvedValue([rule]);
      alertLogRepository.findOne.mockResolvedValue(null); // simulates cooldown window having passed
      slackAdapter.send.mockResolvedValue({ success: true });

      await service.evaluateTransition({
        orgId: 'org-1',
        entityType: AlertEntityType.HOST,
        entityId: 'host-1',
        previousStatus: 'healthy',
        newStatus: 'unreachable',
      });

      expect(slackAdapter.send).toHaveBeenCalledTimes(1);
    });

    it('records a failed AlertLog with the adapter error, without throwing', async () => {
      const rule = makeRule();
      alertRuleRepository.find.mockResolvedValue([rule]);
      alertLogRepository.findOne.mockResolvedValue(null);
      slackAdapter.send.mockResolvedValue({ success: false, error: 'webhook unreachable' });

      await expect(
        service.evaluateTransition({
          orgId: 'org-1',
          entityType: AlertEntityType.HOST,
          entityId: 'host-1',
          previousStatus: 'healthy',
          newStatus: 'unreachable',
        }),
      ).resolves.toBeUndefined();

      expect(alertLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deliveryStatus: AlertDeliveryStatus.FAILED,
          error: 'webhook unreachable',
        }),
      );
    });

    it('never throws even when the adapter itself throws', async () => {
      const rule = makeRule();
      alertRuleRepository.find.mockResolvedValue([rule]);
      alertLogRepository.findOne.mockResolvedValue(null);
      slackAdapter.send.mockRejectedValue(new Error('network exploded'));

      await expect(
        service.evaluateTransition({
          orgId: 'org-1',
          entityType: AlertEntityType.HOST,
          entityId: 'host-1',
          previousStatus: 'healthy',
          newStatus: 'unreachable',
        }),
      ).resolves.toBeUndefined();

      expect(alertLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deliveryStatus: AlertDeliveryStatus.FAILED,
          error: 'network exploded',
        }),
      );
    });

    it('never throws even when rule lookup itself throws', async () => {
      alertRuleRepository.find.mockRejectedValue(new Error('db down'));

      await expect(
        service.evaluateTransition({
          orgId: 'org-1',
          entityType: AlertEntityType.HOST,
          entityId: 'host-1',
          previousStatus: 'healthy',
          newStatus: 'unreachable',
        }),
      ).resolves.toBeUndefined();
    });

    it('does not send when no enabled rule matches', async () => {
      alertRuleRepository.find.mockResolvedValue([]);

      await service.evaluateTransition({
        orgId: 'org-1',
        entityType: AlertEntityType.HOST,
        entityId: 'host-1',
        previousStatus: 'healthy',
        newStatus: 'unreachable',
      });

      expect(slackAdapter.send).not.toHaveBeenCalled();
    });
  });

  describe('evaluateDirectCondition', () => {
    it('dispatches using the given condition and message directly', async () => {
      const rule = makeRule({
        condition: 'system:idle_host_detected',
        entityType: AlertEntityType.SYSTEM,
      });
      alertRuleRepository.find.mockResolvedValue([rule]);
      alertLogRepository.findOne.mockResolvedValue(null);
      slackAdapter.send.mockResolvedValue({ success: true });

      await service.evaluateDirectCondition({
        orgId: 'org-1',
        entityType: AlertEntityType.SYSTEM,
        entityId: 'host-1',
        condition: 'system:idle_host_detected',
        message: 'Host prod-01 looks idle',
      });

      expect(slackAdapter.send).toHaveBeenCalledWith('Host prod-01 looks idle', {
        webhook_url: 'https://example.com/hook',
      });
    });
  });
});
