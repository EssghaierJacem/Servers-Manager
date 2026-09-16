import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Host } from './entities/host.entity';
import { HostsService } from './hosts.service';
import { HostsController } from './hosts.controller';
import { HealthCheckLogModule } from '../health-check-log/health-check-log.module';
import { HEALTH_CHECK_QUEUE } from '../health-check/health-check.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Host]),
    HealthCheckLogModule,
    BullModule.registerQueue({ name: HEALTH_CHECK_QUEUE }),
  ],
  controllers: [HostsController],
  providers: [HostsService],
  exports: [HostsService],
})
export class HostsModule {}
