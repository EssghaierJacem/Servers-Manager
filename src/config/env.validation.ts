import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().uri().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  SSH_KEY_ENCRYPTION_SECRET: Joi.string().hex().length(64).required(),

  HEALTH_CHECK_CONCURRENCY: Joi.number().default(5),
  HEALTH_CHECK_INTERVAL_MS: Joi.number().default(120000),
  SSH_CONNECT_TIMEOUT_MS: Joi.number().default(8000),

  DOMAIN_CHECK_CONCURRENCY: Joi.number().default(5),
  DOMAIN_CHECK_INTERVAL_MS: Joi.number().default(21600000),
  DNS_TIMEOUT_MS: Joi.number().default(5000),
  WHOIS_TIMEOUT_MS: Joi.number().default(9000),
  TLS_TIMEOUT_MS: Joi.number().default(8000),

  ROLLBACK_CONCURRENCY: Joi.number().default(5),
});
