import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { CryptoService } from '../crypto/crypto.service';
import { SshCommandResult, SshConnectionService } from '../ssh/ssh.service';
import { Host, HostStatus } from '../hosts/entities/host.entity';
import { HealthCheckStatus } from '../hosts/entities/health-check-status.enum';
import { HealthCheckEntityType } from '../health-check-log/entities/health-check-log.entity';
import { HealthCheckLogService } from '../health-check-log/health-check-log.service';
import { enqueuePerEntityJobs } from '../common/bullmq/fan-out.util';
import { ServicesSyncService } from '../services/services-sync.service';
import { AlertEvaluationService } from '../alerts/alert-evaluation.service';
import { AlertEntityType } from '../alerts/entities/alert-rule.entity';
import { HealthCheckJobData } from './health-check-job.interface';
import {
  HEALTH_CHECK_QUEUE,
  HEALTH_CHECK_JOB,
  HEALTH_CHECK_TICK_JOB,
  HEALTH_CHECK_CONCURRENCY,
  DOCKER_PS_COMMAND,
  UPTIME_COMMAND,
} from './health-check.constants';
import {
  HealthCheckOutcome,
  mapCommandResultsToOutcome,
  mapSshFailureToOutcome,
} from './health-check-status-mapper';

const HEALTH_CHECK_STATUS_TO_HOST_STATUS: Record<HealthCheckStatus, HostStatus> = {
  [HealthCheckStatus.HEALTHY]: HostStatus.HEALTHY,
  [HealthCheckStatus.DEGRADED]: HostStatus.DEGRADED,
  [HealthCheckStatus.UNREACHABLE]: HostStatus.UNREACHABLE,
  [HealthCheckStatus.PENDING_SETUP]: HostStatus.PENDING_SETUP,
};

const SUCCESSFUL_CONNECTION_STATUSES: ReadonlySet<HealthCheckStatus> = new Set([
  HealthCheckStatus.HEALTHY,
  HealthCheckStatus.DEGRADED,
]);

@Processor(HEALTH_CHECK_QUEUE, { concurrency: HEALTH_CHECK_CONCURRENCY })
export class HealthCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(HealthCheckProcessor.name);

  constructor(
    @InjectRepository(Host)
    private readonly hostRepository: Repository<Host>,
    private readonly healthCheckLogService: HealthCheckLogService,
    private readonly cryptoService: CryptoService,
    private readonly sshConnectionService: SshConnectionService,
    private readonly servicesSyncService: ServicesSyncService,
    private readonly alertEvaluationService: AlertEvaluationService,
    @InjectQueue(HEALTH_CHECK_QUEUE)
    private readonly healthCheckQueue: Queue<HealthCheckJobData>,
  ) {
    super();
  }

  async process(job: Job<Partial<HealthCheckJobData>>): Promise<void> {
    if (job.name === HEALTH_CHECK_TICK_JOB) {
      await this.enqueueCheckForAllHosts();
      return;
    }

    await this.checkHost(job.data.hostId as string);
  }

  private async enqueueCheckForAllHosts(): Promise<void> {
    const hosts = await this.hostRepository.find({ select: ['id'] });
    await enqueuePerEntityJobs(
      this.healthCheckQueue,
      HEALTH_CHECK_JOB,
      hosts.map((host) => host.id),
      (hostId) => ({
        hostId,
      }),
    );
    this.logger.debug(`Enqueued health checks for ${hosts.length} host(s)`);
  }

  private async checkHost(hostId: string): Promise<void> {
    const host = await this.hostRepository.findOne({ where: { id: hostId } });
    if (!host) {
      this.logger.warn(`Skipping health check for missing host ${hostId}`);
      return;
    }

    const previousStatus = host.status;
    const { outcome, sshResults } = await this.runCheck(host);

    await this.healthCheckLogService.write({
      entityType: HealthCheckEntityType.HOST,
      entityId: host.id,
      status: outcome.status,
      rawOutput: outcome.rawOutput,
    });

    host.status = HEALTH_CHECK_STATUS_TO_HOST_STATUS[outcome.status];
    host.lastCheckedAt = new Date();
    if (host.setupVerifiedAt === null && SUCCESSFUL_CONNECTION_STATUSES.has(outcome.status)) {
      host.setupVerifiedAt = host.lastCheckedAt;
    }
    await this.hostRepository.save(host);

    this.logger.debug(`Host ${host.id} (${host.name}) checked -> ${outcome.status}`);

    await this.alertEvaluationService.evaluateTransition({
      orgId: host.orgId,
      entityType: AlertEntityType.HOST,
      entityId: host.id,
      previousStatus,
      newStatus: host.status,
    });

    // The docker ps -a output was already fetched above in the same SSH
    // session as the uptime check - reuse it for the service sync rather
    // than opening a second connection to the same host. If the SSH
    // connection itself failed, there's nothing to sync from.
    if (sshResults) {
      const [, dockerPsResult] = sshResults;
      await this.servicesSyncService.sync(host, dockerPsResult);
    }
  }

  private async runCheck(
    host: Host,
  ): Promise<{ outcome: HealthCheckOutcome; sshResults: SshCommandResult[] | null }> {
    let privateKey: string;
    try {
      privateKey = this.cryptoService.decrypt(host.sshKeyEncrypted);
    } catch (error) {
      this.logger.error(`Failed to decrypt SSH key for host ${host.id}`);
      return { outcome: mapSshFailureToOutcome(error, host.setupVerifiedAt), sshResults: null };
    }

    try {
      const results = await this.sshConnectionService.runCommands(
        {
          host: host.ipAddress,
          port: host.sshPort,
          username: host.sshUser,
          privateKey,
        },
        [UPTIME_COMMAND, DOCKER_PS_COMMAND],
      );
      return { outcome: mapCommandResultsToOutcome(results), sshResults: results };
    } catch (error) {
      this.logger.warn(`SSH connection to host ${host.id} failed: ${(error as Error).message}`);
      return { outcome: mapSshFailureToOutcome(error, host.setupVerifiedAt), sshResults: null };
    } finally {
      privateKey = '';
    }
  }
}
