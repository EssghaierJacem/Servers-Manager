import type { AlertEntityType } from './types';

export interface AlertConditionOption {
  value: string;
  label: string;
  entityType: AlertEntityType;
}

/**
 * Mirrors the backend's fixed ALERT_CONDITIONS list (src/alerts/alert-condition.ts) -
 * condition and entity_type are coupled there, so picking a plain-language
 * label here sets both fields on the create request.
 */
export const ALERT_CONDITION_OPTIONS: AlertConditionOption[] = [
  {
    value: 'host_status_transitioned_to:unreachable',
    label: 'A host becomes unreachable',
    entityType: 'host',
  },
  {
    value: 'host_status_transitioned_to:degraded',
    label: 'A host becomes degraded',
    entityType: 'host',
  },
  {
    value: 'ssl_status_transitioned_to:expiring_soon',
    label: 'An SSL certificate is expiring soon',
    entityType: 'ssl_certificate',
  },
  {
    value: 'ssl_status_transitioned_to:expired',
    label: 'An SSL certificate expires',
    entityType: 'ssl_certificate',
  },
  {
    value: 'service_status_transitioned_to:crash_loop',
    label: 'A service enters a crash loop',
    entityType: 'service',
  },
  {
    value: 'service_status_transitioned_to:unhealthy',
    label: 'A service becomes unhealthy',
    entityType: 'service',
  },
  {
    value: 'rollback_event:failed',
    label: 'A rollback fails',
    entityType: 'rollback_event',
  },
  {
    value: 'system:idle_host_detected',
    label: 'An idle host is detected',
    entityType: 'system',
  },
  {
    value: 'system:orphan_detected',
    label: 'An orphaned domain or host is detected',
    entityType: 'system',
  },
];

export function findAlertConditionOption(value: string): AlertConditionOption | undefined {
  return ALERT_CONDITION_OPTIONS.find((option) => option.value === value);
}

export function describeAlertCondition(value: string): string {
  return findAlertConditionOption(value)?.label ?? value;
}
