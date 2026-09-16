import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Domain } from './entities/domain.entity';
import { SSLCertificate } from './entities/ssl-certificate.entity';
import { DomainsService } from './domains.service';
import { DomainsController } from './domains.controller';
import { HealthCheckLogModule } from '../health-check-log/health-check-log.module';
import { HostsModule } from '../hosts/hosts.module';
import { DOMAIN_CHECK_QUEUE } from '../domain-check/domain-check.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Domain, SSLCertificate]),
    HealthCheckLogModule,
    HostsModule,
    BullModule.registerQueue({ name: DOMAIN_CHECK_QUEUE }),
  ],
  controllers: [DomainsController],
  providers: [DomainsService],
  exports: [DomainsService],
})
export class DomainsModule {}
