export const ROLLBACK_QUEUE = 'rollback';
export const ROLLBACK_JOB = 'rollback-service';

const DEFAULT_ROLLBACK_CONCURRENCY = 5;
export const ROLLBACK_CONCURRENCY = parseInt(
  process.env.ROLLBACK_CONCURRENCY ?? String(DEFAULT_ROLLBACK_CONCURRENCY),
  10,
);

export const ROLLBACK_EVENTS_LIST_LIMIT = 50;
