import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration, { AppConfig } from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { CryptoModule } from './crypto/crypto.module';
import { RateLimiterModule } from './common/rate-limit/rate-limiter.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthCheckLogModule } from './health-check-log/health-check-log.module';
import { HostsModule } from './hosts/hosts.module';
import { HealthCheckModule } from './health-check/health-check.module';
import { DomainsModule } from './domains/domains.module';
import { DomainCheckModule } from './domain-check/domain-check.module';
import { ServicesModule } from './services/services.module';
import { DeploymentSnapshotsModule } from './deployment-snapshots/deployment-snapshots.module';
import { RollbackModule } from './rollback/rollback.module';
import { AlertsModule } from './alerts/alerts.module';
import { InsightsModule } from './insights/insights.module';
import { OverviewModule } from './overview/overview.module';
import { CloudAccountsModule } from './cloud-accounts/cloud-accounts.module';
import { Organization } from './organizations/entities/organization.entity';
import { User } from './users/entities/user.entity';
import { Host } from './hosts/entities/host.entity';
import { HealthCheckLog } from './health-check-log/entities/health-check-log.entity';
import { Domain } from './domains/entities/domain.entity';
import { SSLCertificate } from './domains/entities/ssl-certificate.entity';
import { Service } from './services/entities/service.entity';
import { DeploymentSnapshot } from './deployment-snapshots/entities/deployment-snapshot.entity';
import { RollbackEvent } from './rollback/entities/rollback-event.entity';
import { AlertRule } from './alerts/entities/alert-rule.entity';
import { AlertLog } from './alerts/entities/alert-log.entity';
import { InsightState } from './insights/entities/insight-state.entity';
import { CloudAccount } from './cloud-accounts/entities/cloud-account.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        type: 'postgres',
        url: configService.get('databaseUrl', { infer: true }),
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
          CloudAccount,
        ],
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        connection: {
          host: configService.get('redis', { infer: true }).host,
          port: configService.get('redis', { infer: true }).port,
        },
      }),
    }),
    CryptoModule,
    RateLimiterModule,
    OrganizationsModule,
    UsersModule,
    AuthModule,
    HealthCheckLogModule,
    HostsModule,
    HealthCheckModule,
    DomainsModule,
    DomainCheckModule,
    ServicesModule,
    DeploymentSnapshotsModule,
    RollbackModule,
    AlertsModule,
    InsightsModule,
    OverviewModule,
    CloudAccountsModule,
  ],
})
export class AppModule {}
