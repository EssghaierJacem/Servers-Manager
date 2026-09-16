import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Host } from './entities/host.entity';
import { HealthCheckLog } from './entities/health-check-log.entity';
import { HostsService } from './hosts.service';
import { HostsController } from './hosts.controller';
import { OverviewController } from './overview.controller';
import { HEALTH_CHECK_QUEUE } from '../health-check/health-check.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Host, HealthCheckLog]),
    BullModule.registerQueue({ name: HEALTH_CHECK_QUEUE }),
  ],
  controllers: [HostsController, OverviewController],
  providers: [HostsService],
  exports: [HostsService],
})
export class HostsModule {}
