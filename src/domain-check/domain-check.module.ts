import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Domain } from '../domains/entities/domain.entity';
import { SSLCertificate } from '../domains/entities/ssl-certificate.entity';
import { HealthCheckLogModule } from '../health-check-log/health-check-log.module';
import { AlertsModule } from '../alerts/alerts.module';
import { DOMAIN_CHECK_QUEUE } from './domain-check.constants';
import { DomainCheckProcessor } from './domain-check.processor';
import { DomainCheckScheduler } from './domain-check.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Domain, SSLCertificate]),
    HealthCheckLogModule,
    AlertsModule,
    BullModule.registerQueue({
      name: DOMAIN_CHECK_QUEUE,
      defaultJobOptions: { removeOnComplete: true, removeOnFail: 50 },
    }),
  ],
  providers: [DomainCheckProcessor, DomainCheckScheduler],
})
export class DomainCheckModule {}
