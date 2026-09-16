import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { RateLimiterService } from '../common/rate-limit/rate-limiter.service';
import {
  HealthCheckEntityType,
  HealthCheckLog,
} from '../health-check-log/entities/health-check-log.entity';
import { HealthCheckLogService } from '../health-check-log/health-check-log.service';
import { HostsService } from '../hosts/hosts.service';
import {
  DOMAIN_CHECK_JOB,
  DOMAIN_CHECK_QUEUE,
  DOMAIN_CHECK_RATE_LIMIT_WINDOW_SECONDS,
} from '../domain-check/domain-check.constants';
import { DomainCheckJobData } from '../domain-check/domain-check-job.interface';
import { CreateDomainDto } from './dto/create-domain.dto';
import { Domain, DomainDnsStatus } from './entities/domain.entity';
import { SSLCertificate, SslCertificateStatus } from './entities/ssl-certificate.entity';

export interface DomainOverviewCounts {
  domains_total: number;
  ssl_valid: number;
  ssl_expiring_soon: number;
  ssl_expired: number;
  ssl_invalid: number;
  domains_not_resolving: number;
}

@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(Domain)
    private readonly domainRepository: Repository<Domain>,
    @InjectRepository(SSLCertificate)
    private readonly sslCertificateRepository: Repository<SSLCertificate>,
    private readonly healthCheckLogService: HealthCheckLogService,
    private readonly hostsService: HostsService,
    private readonly rateLimiterService: RateLimiterService,
    @InjectQueue(DOMAIN_CHECK_QUEUE)
    private readonly domainCheckQueue: Queue<DomainCheckJobData>,
  ) {}

  async create(orgId: string, dto: CreateDomainDto): Promise<{ domain: Domain; jobId: string }> {
    if (dto.host_id) {
      await this.hostsService.findOneForOrgOrThrow(orgId, dto.host_id);
    }

    const existing = await this.domainRepository.findOne({
      where: { orgId, hostname: dto.hostname },
    });
    if (existing) {
      throw new ConflictException(
        `Domain ${dto.hostname} is already registered for this organization`,
      );
    }

    const domain = await this.domainRepository.save(
      this.domainRepository.create({
        orgId,
        hostId: dto.host_id ?? null,
        hostname: dto.hostname,
      }),
    );

    await this.sslCertificateRepository.save(
      this.sslCertificateRepository.create({ domainId: domain.id }),
    );

    const jobId = await this.enqueueJob(domain.id);
    return { domain, jobId };
  }

  async findAllForOrg(
    orgId: string,
  ): Promise<Array<{ domain: Domain; sslStatus: SslCertificateStatus }>> {
    const domains = await this.domainRepository.find({
      where: { orgId },
      order: { createdAt: 'DESC' },
    });
    if (domains.length === 0) {
      return [];
    }

    const certs = await this.sslCertificateRepository.find({
      where: domains.map((domain) => ({ domainId: domain.id })),
    });
    const statusByDomainId = new Map(certs.map((cert) => [cert.domainId, cert.status]));

    return domains.map((domain) => ({
      domain,
      sslStatus: statusByDomainId.get(domain.id) ?? SslCertificateStatus.UNKNOWN,
    }));
  }

  async findOneForOrgOrThrow(orgId: string, id: string): Promise<Domain> {
    const domain = await this.domainRepository.findOne({ where: { id, orgId } });
    if (!domain) {
      throw new NotFoundException(`Domain ${id} not found`);
    }
    return domain;
  }

  async getSslCertificateOrThrow(domainId: string): Promise<SSLCertificate> {
    const cert = await this.sslCertificateRepository.findOne({ where: { domainId } });
    if (!cert) {
      throw new NotFoundException(`SSL certificate record for domain ${domainId} not found`);
    }
    return cert;
  }

  getRecentLogs(domainId: string): Promise<HealthCheckLog[]> {
    return this.healthCheckLogService.findRecent(
      [HealthCheckEntityType.DOMAIN, HealthCheckEntityType.SSL_CERTIFICATE],
      domainId,
    );
  }

  async remove(orgId: string, id: string): Promise<void> {
    const domain = await this.findOneForOrgOrThrow(orgId, id);
    await this.domainRepository.remove(domain);
  }

  async enqueueCheck(orgId: string, id: string): Promise<string> {
    await this.findOneForOrgOrThrow(orgId, id);

    const acquired = await this.rateLimiterService.tryAcquire(
      `domain-check:${id}`,
      DOMAIN_CHECK_RATE_LIMIT_WINDOW_SECONDS,
    );
    if (!acquired) {
      throw new HttpException(
        `Domain ${id} was checked too recently; try again in under a minute`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return this.enqueueJob(id);
  }

  private async enqueueJob(domainId: string): Promise<string> {
    const job = await this.domainCheckQueue.add(
      DOMAIN_CHECK_JOB,
      { domainId },
      { removeOnComplete: true, removeOnFail: 50 },
    );
    return job.id as string;
  }

  async getOverview(orgId: string): Promise<DomainOverviewCounts> {
    const domains = await this.domainRepository.find({ where: { orgId } });
    if (domains.length === 0) {
      return {
        domains_total: 0,
        ssl_valid: 0,
        ssl_expiring_soon: 0,
        ssl_expired: 0,
        ssl_invalid: 0,
        domains_not_resolving: 0,
      };
    }

    const certs = await this.sslCertificateRepository.find({
      where: domains.map((domain) => ({ domainId: domain.id })),
    });

    const bySslStatus: Record<SslCertificateStatus, number> = {
      [SslCertificateStatus.VALID]: 0,
      [SslCertificateStatus.EXPIRING_SOON]: 0,
      [SslCertificateStatus.EXPIRED]: 0,
      [SslCertificateStatus.INVALID]: 0,
      [SslCertificateStatus.UNKNOWN]: 0,
    };
    for (const cert of certs) {
      bySslStatus[cert.status] += 1;
    }

    const domainsNotResolving = domains.filter(
      (domain) => domain.dnsStatus === DomainDnsStatus.NOT_RESOLVING,
    ).length;

    return {
      domains_total: domains.length,
      ssl_valid: bySslStatus[SslCertificateStatus.VALID],
      ssl_expiring_soon: bySslStatus[SslCertificateStatus.EXPIRING_SOON],
      ssl_expired: bySslStatus[SslCertificateStatus.EXPIRED],
      ssl_invalid: bySslStatus[SslCertificateStatus.INVALID],
      domains_not_resolving: domainsNotResolving,
    };
  }
}
