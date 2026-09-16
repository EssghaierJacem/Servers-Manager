/**
 * The fixed set of alertable conditions. This is deliberately not a
 * generic rule DSL - adding a new condition means adding a new string
 * here (and a call site that fires it), not exposing free-form rule
 * authoring through the API.
 */
export const ALERT_CONDITIONS = [
  'host_status_transitioned_to:unreachable',
  'host_status_transitioned_to:degraded',
  'ssl_status_transitioned_to:expiring_soon',
  'ssl_status_transitioned_to:expired',
  'service_status_transitioned_to:crash_loop',
  'service_status_transitioned_to:unhealthy',
  'rollback_event:failed',
  'system:idle_host_detected',
  'system:orphan_detected',
] as const;

export type AlertCondition = (typeof ALERT_CONDITIONS)[number];
