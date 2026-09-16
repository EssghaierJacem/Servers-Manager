import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { Host } from '../hosts/entities/host.entity';
import { HealthCheckLog } from '../hosts/entities/health-check-log.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Organization, User, Host, HealthCheckLog],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
