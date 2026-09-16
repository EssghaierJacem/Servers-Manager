import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServicesService } from './services.service';
import { ServicesSyncService } from './services-sync.service';
import { ServicesController } from './services.controller';
import { HostServicesController } from './host-services.controller';
import { HealthCheckLogModule } from '../health-check-log/health-check-log.module';
import { HostsModule } from '../hosts/hosts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Service]), HealthCheckLogModule, HostsModule],
  controllers: [ServicesController, HostServicesController],
  providers: [ServicesService, ServicesSyncService],
  exports: [ServicesService, ServicesSyncService],
})
export class ServicesModule {}
