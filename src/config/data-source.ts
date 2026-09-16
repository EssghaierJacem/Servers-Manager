import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { Host } from '../hosts/entities/host.entity';
import { HealthCheckLog } from '../health-check-log/entities/health-check-log.entity';
import { Domain } from '../domains/entities/domain.entity';
import { SSLCertificate } from '../domains/entities/ssl-certificate.entity';
import { Service } from '../services/entities/service.entity';
import { DeploymentSnapshot } from '../deployment-snapshots/entities/deployment-snapshot.entity';
import { RollbackEvent } from '../rollback/entities/rollback-event.entity';
import { AlertRule } from '../alerts/entities/alert-rule.entity';
import { AlertLog } from '../alerts/entities/alert-log.entity';
import { InsightState } from '../insights/entities/insight-state.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    Organization,
    User,
    Host,
    HealthCheckLog,
    Domain,
    SSLCertificate,
    Service,
    DeploymentSnapshot,
    RollbackEvent,
    AlertRule,
    AlertLog,
    InsightState,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
