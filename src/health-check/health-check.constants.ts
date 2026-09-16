export const HEALTH_CHECK_QUEUE = 'health-check';
export const HEALTH_CHECK_JOB = 'check-host';
export const HEALTH_CHECK_TICK_JOB = 'check-all-hosts-tick';
export const HEALTH_CHECK_REPEATABLE_JOB_ID = 'health-check-all-hosts';

const DEFAULT_HEALTH_CHECK_CONCURRENCY = 5;
export const HEALTH_CHECK_CONCURRENCY = parseInt(
  process.env.HEALTH_CHECK_CONCURRENCY ?? String(DEFAULT_HEALTH_CHECK_CONCURRENCY),
  10,
);

export const DOCKER_PS_COMMAND = "docker ps --format '{{json .}}'";
export const UPTIME_COMMAND = 'uptime';
