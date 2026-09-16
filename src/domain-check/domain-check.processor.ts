import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { AppConfig } from '../config/configuration';
import { enqueuePerEntityJobs } from '../common/bullmq/fan-out.util';
import { HealthCheckEntityType } from '../health-check-log/entities/health-check-log.entity';
import { HealthCheckLogService } from '../health-check-log/health-check-log.service';
import { Domain, DomainDnsStatus } from '../domains/entities/domain.entity';
import { SSLCertificate } from '../domains/entities/ssl-certificate.entity';
import { AlertEvaluationService } from '../alerts/alert-evaluation.service';
import { AlertEntityType } from '../alerts/entities/alert-rule.entity';
import { performDnsCheck } from './checks/dns-check';
import { performWhoisLookup } from './checks/whois-check';
import { performTlsCheck } from './checks/tls-check';
import { DomainCheckJobData } from './domain-check-job.interface';
import {
  DOMAIN_CHECK_CONCURRENCY,
  DOMAIN_CHECK_JOB,
  DOMAIN_CHECK_QUEUE,
  DOMAIN_CHECK_TICK_JOB,
} from './domain-check.constants';

@Processor(DOMAIN_CHECK_QUEUE, { concurrency: DOMAIN_CHECK_CONCURRENCY })
export class DomainCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(DomainCheckProcessor.name);
  private readonly dnsTimeoutMs: number;
  private readonly whoisTimeoutMs: number;
  private readonly tlsTimeoutMs: number;

  constructor(
    @InjectRepository(Domain)
    private readonly domainRepository: Repository<Domain>,
    @InjectRepository(SSLCertificate)
    private readonly sslCertificateRepository: Repository<SSLCertificate>,
    private readonly healthCheckLogService: HealthCheckLogService,
    private readonly alertEvaluationService: AlertEvaluationService,
    @InjectQueue(DOMAIN_CHECK_QUEUE)
    private readonly domainCheckQueue: Queue<DomainCheckJobData>,
    configService: ConfigService<AppConfig, true>,
  ) {
    super();
    const domainCheckConfig = configService.get('domainCheck', { infer: true });
    this.dnsTimeoutMs = domainCheckConfig.dnsTimeoutMs;
    this.whoisTimeoutMs = domainCheckConfig.whoisTimeoutMs;
    this.tlsTimeoutMs = domainCheckConfig.tlsTimeoutMs;
  }

  async process(job: Job<Partial<DomainCheckJobData>>): Promise<void> {
    if (job.name === DOMAIN_CHECK_TICK_JOB) {
      await this.enqueueCheckForAllDomains();
      return;
    }

    await this.checkDomain(job.data.domainId as string);
  }

  private async enqueueCheckForAllDomains(): Promise<void> {
    const domains = await this.domainRepository.find({ select: ['id'] });
    await enqueuePerEntityJobs(
      this.domainCheckQueue,
      DOMAIN_CHECK_JOB,
      domains.map((domain) => domain.id),
      (domainId) => ({ domainId }),
    );
    this.logger.debug(`Enqueued domain checks for ${domains.length} domain(s)`);
  }

  private async checkDomain(domainId: string): Promise<void> {
    const domain = await this.domainRepository.findOne({ where: { id: domainId } });
    if (!domain) {
      this.logger.warn(`Skipping check for missing domain ${domainId}`);
      return;
    }

    const dnsResult = await performDnsCheck(domain.hostname, this.dnsTimeoutMs);
    await this.healthCheckLogService.write({
      entityType: HealthCheckEntityType.DOMAIN,
      entityId: domain.id,
      status: dnsResult.status,
      rawOutput: { check: 'dns', ...dnsResult.rawOutput },
    });

    domain.dnsStatus = dnsResult.status;
    domain.resolvedIp = dnsResult.resolvedIp;

    // WHOIS is attempted regardless of DNS outcome: a domain can fail to
    // resolve while still being registered, and vice versa.
    const whoisResult = await performWhoisLookup(domain.hostname, this.whoisTimeoutMs);
    await this.healthCheckLogService.write({
      entityType: HealthCheckEntityType.DOMAIN,
      entityId: domain.id,
      status: whoisResult.ok ? 'whois_ok' : 'whois_failed',
      rawOutput: { check: 'whois', ...whoisResult.rawOutput },
    });

    if (whoisResult.registrar) {
      domain.registrar = whoisResult.registrar;
    }
    if (whoisResult.expiresAt) {
      domain.domainExpiresAt = whoisResult.expiresAt;
    }

    domain.lastCheckedAt = new Date();
    await this.domainRepository.save(domain);

    if (dnsResult.status === DomainDnsStatus.RESOLVING && dnsResult.resolvedIp) {
      await this.checkTls(domain, dnsResult.resolvedIp);
    } else {
      await this.healthCheckLogService.write({
        entityType: HealthCheckEntityType.SSL_CERTIFICATE,
        entityId: domain.id,
        status: 'skipped',
        rawOutput: { reason: 'DNS did not resolve; nothing to connect to' },
      });
    }

    this.logger.debug(
      `Domain ${domain.id} (${domain.hostname}) checked -> dns=${domain.dnsStatus}`,
    );
  }

  private async checkTls(domain: Domain, resolvedIp: string): Promise<void> {
    const tlsResult = await performTlsCheck(resolvedIp, domain.hostname, this.tlsTimeoutMs);

    await this.healthCheckLogService.write({
      entityType: HealthCheckEntityType.SSL_CERTIFICATE,
      entityId: domain.id,
      status: tlsResult.status,
      rawOutput: tlsResult.rawOutput,
    });

    const cert = await this.sslCertificateRepository.findOne({ where: { domainId: domain.id } });
    if (!cert) {
      this.logger.warn(`No SSLCertificate row for domain ${domain.id}; skipping update`);
      return;
    }

    const previousStatus = cert.status;
    cert.status = tlsResult.status;
    cert.issuer = tlsResult.issuer;
    cert.validFrom = tlsResult.validFrom;
    cert.validTo = tlsResult.validTo;
    cert.lastCheckedAt = new Date();
    await this.sslCertificateRepository.save(cert);

    await this.alertEvaluationService.evaluateTransition({
      orgId: domain.orgId,
      entityType: AlertEntityType.SSL_CERTIFICATE,
      entityId: domain.id,
      previousStatus,
      newStatus: cert.status,
    });
  }
}
