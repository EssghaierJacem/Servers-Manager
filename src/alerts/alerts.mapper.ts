import { AlertRule } from './entities/alert-rule.entity';
import { AlertLog } from './entities/alert-log.entity';
import { AlertRuleResponseDto } from './dto/alert-rule-response.dto';
import { AlertLogResponseDto } from './dto/alert-log-response.dto';

/**
 * Deliberately omits channel_config_encrypted - it's an encrypted
 * credential (e.g. a Slack webhook URL), never returned by any response,
 * same posture as SSH keys and rollback config blobs.
 */
export function toAlertRuleResponseDto(rule: AlertRule): AlertRuleResponseDto {
  return {
    id: rule.id,
    name: rule.name,
    entity_type: rule.entityType,
    condition: rule.condition,
    channel: rule.channel,
    cooldown_minutes: rule.cooldownMinutes,
    enabled: rule.enabled,
    created_at: rule.createdAt,
  };
}

export function toAlertLogResponseDto(log: AlertLog): AlertLogResponseDto {
  return {
    id: log.id,
    alert_rule_id: log.alertRuleId,
    entity_type: log.entityType,
    entity_id: log.entityId,
    message: log.message,
    delivery_status: log.deliveryStatus,
    error: log.error,
    fired_at: log.firedAt,
  };
}
