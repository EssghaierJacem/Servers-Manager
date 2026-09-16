import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RollbackEvent } from './entities/rollback-event.entity';
import { Service } from '../services/entities/service.entity';
import { Host } from '../hosts/entities/host.entity';
import { DeploymentSnapshot } from '../deployment-snapshots/entities/deployment-snapshot.entity';
import { RollbackService } from './rollback.service';
import { RollbackProcessor } from './rollback.processor';
import { ServiceRollbackController } from './service-rollback.controller';
import { RollbackEventsController } from './rollback-events.controller';
import { ServicesModule } from '../services/services.module';
import { DeploymentSnapshotsModule } from '../deployment-snapshots/deployment-snapshots.module';
import { HealthCheckLogModule } from '../health-check-log/health-check-log.module';
import { SshModule } from '../ssh/ssh.module';
import { ROLLBACK_QUEUE } from './rollback.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([RollbackEvent, Service, Host, DeploymentSnapshot]),
    ServicesModule,
    DeploymentSnapshotsModule,
    HealthCheckLogModule,
    SshModule,
    BullModule.registerQueue({
      name: ROLLBACK_QUEUE,
      defaultJobOptions: { removeOnComplete: true, removeOnFail: 50 },
    }),
  ],
  controllers: [ServiceRollbackController, RollbackEventsController],
  providers: [RollbackService, RollbackProcessor],
})
export class RollbackModule {}
