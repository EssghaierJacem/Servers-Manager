import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthCheckLog } from './entities/health-check-log.entity';
import { HealthCheckLogService } from './health-check-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([HealthCheckLog])],
  providers: [HealthCheckLogService],
  exports: [HealthCheckLogService],
})
export class HealthCheckLogModule {}
