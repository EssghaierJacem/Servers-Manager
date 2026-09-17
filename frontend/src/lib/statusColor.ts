export type StatusColorKey = 'healthy' | 'warning' | 'critical' | 'unknown';

const HEALTHY = new Set(['healthy', 'running', 'valid', 'resolving', 'sent']);
const WARNING = new Set(['degraded', 'expiring_soon']);
const CRITICAL = new Set([
  'unreachable',
  'crash_loop',
  'unhealthy',
  'expired',
  'invalid',
  'failed',
  'not_resolving',
]);
// unknown/stopped/pending, and anything unrecognized, fall through to `unknown`.
// stopped is a neutral state, not a failure - it is never colored critical.

/**
 * Maps a raw backend status string to one of the four functional status
 * colors. This is the single source of truth for status -> color across
 * the app - every StatusDot goes through this rather than re-deriving it.
 */
export function getStatusColorKey(status: string): StatusColorKey {
  if (HEALTHY.has(status)) return 'healthy';
  if (WARNING.has(status)) return 'warning';
  if (CRITICAL.has(status)) return 'critical';
  return 'unknown';
}
