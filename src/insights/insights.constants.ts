export const INSIGHTS_QUEUE = 'insights';
export const INSIGHTS_TICK_JOB = 'run-insights-check';
export const INSIGHTS_REPEATABLE_JOB_ID = 'insights-daily';

const DEFAULT_INSIGHTS_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const INSIGHTS_INTERVAL_MS = parseInt(
  process.env.INSIGHTS_INTERVAL_MS ?? String(DEFAULT_INSIGHTS_INTERVAL_MS),
  10,
);

/**
 * A host registered more recently than this is never flagged idle, even
 * with zero running containers - it just hasn't had anything deployed to
 * it yet.
 */
export const IDLE_HOST_MIN_AGE_HOURS = 24;
