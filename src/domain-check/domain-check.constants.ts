export const DOMAIN_CHECK_QUEUE = 'domain-check';
export const DOMAIN_CHECK_JOB = 'check-domain';
export const DOMAIN_CHECK_TICK_JOB = 'check-all-domains-tick';
export const DOMAIN_CHECK_REPEATABLE_JOB_ID = 'domain-check-all-domains';

const DEFAULT_DOMAIN_CHECK_CONCURRENCY = 5;
export const DOMAIN_CHECK_CONCURRENCY = parseInt(
  process.env.DOMAIN_CHECK_CONCURRENCY ?? String(DEFAULT_DOMAIN_CHECK_CONCURRENCY),
  10,
);

/** A valid certificate whose valid_to falls within this many days is "expiring_soon". */
export const SSL_EXPIRY_WARNING_DAYS = 14;

export const TLS_PORT = 443;

/** Minimum time between two triggered checks for the same domain. */
export const DOMAIN_CHECK_RATE_LIMIT_WINDOW_SECONDS = 60;
