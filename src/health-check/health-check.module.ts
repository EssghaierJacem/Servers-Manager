import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Host } from '../hosts/entities/host.entity';
import { HealthCheckLogModule } from '../health-check-log/health-check-log.module';
import { SshModule } from '../ssh/ssh.module';
import { ServicesModule } from '../services/services.module';
import { AlertsModule } from '../alerts/alerts.module';
import { HEALTH_CHECK_QUEUE } from './health-check.constants';
import { HealthCheckProcessor } from './health-check.processor';
import { HealthCheckScheduler } from './health-check.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Host]),
    HealthCheckLogModule,
    SshModule,
    ServicesModule,
    AlertsModule,
    BullModule.registerQueue({
      name: HEALTH_CHECK_QUEUE,
      defaultJobOptions: { removeOnComplete: true, removeOnFail: 50 },
    }),
  ],
  providers: [HealthCheckProcessor, HealthCheckScheduler],
})
export class HealthCheckModule {}
