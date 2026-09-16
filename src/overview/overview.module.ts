import { Module } from '@nestjs/common';
import { HostsModule } from '../hosts/hosts.module';
import { DomainsModule } from '../domains/domains.module';
import { ServicesModule } from '../services/services.module';
import { OverviewController } from './overview.controller';

@Module({
  imports: [HostsModule, DomainsModule, ServicesModule],
  controllers: [OverviewController],
})
export class OverviewModule {}
