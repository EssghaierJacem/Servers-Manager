import { AlertEntityType } from './entities/alert-rule.entity';

/**
 * Derives the condition string for a status transition, per entity type.
 * The result may or may not be one of the fixed ALERT_CONDITIONS a rule
 * can actually be created for (e.g. "host_status_transitioned_to:healthy"
 * is a valid string but no such rule can exist) - that's fine, the
 * dispatch step simply won't find a matching rule for it. Returns null
 * when there is no condition scheme at all for that entity type (e.g. a
 * plain "domain" DNS status change) - the caller treats that as "nothing
 * to evaluate".
 */
export function buildTransitionCondition(
  entityType: AlertEntityType,
  newStatus: string,
): string | null {
  switch (entityType) {
    case AlertEntityType.HOST:
      return `host_status_transitioned_to:${newStatus}`;
    case AlertEntityType.SSL_CERTIFICATE:
      return `ssl_status_transitioned_to:${newStatus}`;
    case AlertEntityType.SERVICE:
      return `service_status_transitioned_to:${newStatus}`;
    case AlertEntityType.ROLLBACK_EVENT:
      return newStatus === 'failed' ? 'rollback_event:failed' : null;
    default:
      return null;
  }
}
