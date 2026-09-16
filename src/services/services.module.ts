import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServicesService } from './services.service';
import { ServicesSyncService } from './services-sync.service';
import { ServicesController } from './services.controller';
import { HostServicesController } from './host-services.controller';
import { ServiceSnapshotsController } from './service-snapshots.controller';
import { HealthCheckLogModule } from '../health-check-log/health-check-log.module';
import { HostsModule } from '../hosts/hosts.module';
import { SshModule } from '../ssh/ssh.module';
import { DeploymentSnapshotsModule } from '../deployment-snapshots/deployment-snapshots.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service]),
    HealthCheckLogModule,
    HostsModule,
    SshModule,
    DeploymentSnapshotsModule,
  ],
  controllers: [ServicesController, HostServicesController, ServiceSnapshotsController],
  providers: [ServicesService, ServicesSyncService],
  exports: [ServicesService, ServicesSyncService],
})
export class ServicesModule {}
