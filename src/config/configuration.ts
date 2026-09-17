export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  redis: {
    host: string;
    port: number;
  };
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  sshKeyEncryptionSecret: string;
  corsOrigins: string[];
  healthCheck: {
    concurrency: number;
    intervalMs: number;
    sshConnectTimeoutMs: number;
  };
  domainCheck: {
    concurrency: number;
    intervalMs: number;
    dnsTimeoutMs: number;
    whoisTimeoutMs: number;
    tlsTimeoutMs: number;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL as string,
  redis: {
    host: process.env.REDIS_HOST as string,
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET as string,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  sshKeyEncryptionSecret: process.env.SSH_KEY_ENCRYPTION_SECRET as string,
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),
  healthCheck: {
    concurrency: parseInt(process.env.HEALTH_CHECK_CONCURRENCY ?? '5', 10),
    intervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS ?? '120000', 10),
    sshConnectTimeoutMs: parseInt(process.env.SSH_CONNECT_TIMEOUT_MS ?? '8000', 10),
  },
  domainCheck: {
    concurrency: parseInt(process.env.DOMAIN_CHECK_CONCURRENCY ?? '5', 10),
    intervalMs: parseInt(process.env.DOMAIN_CHECK_INTERVAL_MS ?? '21600000', 10),
    dnsTimeoutMs: parseInt(process.env.DNS_TIMEOUT_MS ?? '5000', 10),
    whoisTimeoutMs: parseInt(process.env.WHOIS_TIMEOUT_MS ?? '9000', 10),
    tlsTimeoutMs: parseInt(process.env.TLS_TIMEOUT_MS ?? '8000', 10),
  },
});
