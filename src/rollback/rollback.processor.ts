import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { CryptoService } from '../crypto/crypto.service';
import { SshCommandResult, SshConnectionService } from '../ssh/ssh.service';
import { Host } from '../hosts/entities/host.entity';
import { Service, ServiceStatus } from '../services/entities/service.entity';
import { classifyContainerStatus } from '../services/container-status-classifier';
import { parseDockerPsOutput, splitImageAndTag } from '../services/docker-ps-parser';
import { HealthCheckEntityType } from '../health-check-log/entities/health-check-log.entity';
import { HealthCheckLogService } from '../health-check-log/health-check-log.service';
import { DeploymentSnapshot } from '../deployment-snapshots/entities/deployment-snapshot.entity';
import { DeploymentSnapshotsService } from '../deployment-snapshots/deployment-snapshots.service';
import { buildDockerRunCommand } from './docker-run-command.builder';
import {
  RollbackEvent,
  RollbackEventStatus,
  RollbackLogEntry,
} from './entities/rollback-event.entity';
import { RollbackJobData } from './rollback-job.interface';
import { ROLLBACK_CONCURRENCY, ROLLBACK_QUEUE } from './rollback.constants';

const DOCKER_PS_ALL_JSON_COMMAND = "docker ps -a --format '{{json .}}'";

/**
 * Executes one rollback: stop -> remove -> recreate -> classify, all in a
 * single SSH session via the shared SshConnectionService, with every step
 * appended to the RollbackEvent's log_output as it happens. No retry, no
 * auto-revert on failure - a failed rollback is left exactly as attempted
 * for a human to look at.
 */
@Processor(ROLLBACK_QUEUE, { concurrency: ROLLBACK_CONCURRENCY })
export class RollbackProcessor extends WorkerHost {
  private readonly logger = new Logger(RollbackProcessor.name);

  constructor(
    @InjectRepository(RollbackEvent)
    private readonly rollbackEventRepository: Repository<RollbackEvent>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Host)
    private readonly hostRepository: Repository<Host>,
    @InjectRepository(DeploymentSnapshot)
    private readonly snapshotRepository: Repository<DeploymentSnapshot>,
    private readonly deploymentSnapshotsService: DeploymentSnapshotsService,
    private readonly cryptoService: CryptoService,
    private readonly sshConnectionService: SshConnectionService,
    private readonly healthCheckLogService: HealthCheckLogService,
  ) {
    super();
  }

  async process(job: Job<RollbackJobData>): Promise<void> {
    const event = await this.rollbackEventRepository.findOne({
      where: { id: job.data.rollbackEventId },
    });
    if (!event) {
      this.logger.error(`Rollback event ${job.data.rollbackEventId} not found; skipping job`);
      return;
    }

    event.status = RollbackEventStatus.IN_PROGRESS;
    await this.rollbackEventRepository.save(event);

    const service = await this.serviceRepository.findOne({ where: { id: event.serviceId } });
    if (!service) {
      await this.fail(event, 'Service no longer exists');
      return;
    }

    const host = await this.hostRepository.findOne({ where: { id: service.hostId } });
    if (!host) {
      await this.fail(event, 'Host no longer exists');
      return;
    }

    const targetSnapshot = await this.snapshotRepository.findOne({
      where: { id: event.toSnapshotId },
    });
    if (!targetSnapshot) {
      await this.fail(event, 'Target snapshot no longer exists');
      return;
    }

    let privateKey: string;
    try {
      privateKey = this.cryptoService.decrypt(host.sshKeyEncrypted);
    } catch (error) {
      await this.fail(event, `Failed to decrypt SSH key: ${(error as Error).message}`);
      return;
    }

    try {
      const config = this.deploymentSnapshotsService.decryptConfig(targetSnapshot);

      let results: SshCommandResult[];
      try {
        results = await this.sshConnectionService.runCommands(
          {
            host: host.ipAddress,
            port: host.sshPort,
            username: host.sshUser,
            privateKey,
          },
          [
            `docker stop ${service.containerId}`,
            `docker rm ${service.containerId}`,
            buildDockerRunCommand(config, targetSnapshot.imageTag),
            DOCKER_PS_ALL_JSON_COMMAND,
          ],
        );
      } catch (error) {
        await this.fail(event, `SSH connection to host failed: ${(error as Error).message}`);
        return;
      }

      const [stopResult, rmResult, runResult, psResult] = results;
      await this.appendLog(event, toLogEntry('stop_container', stopResult));
      await this.appendLog(event, toLogEntry('remove_container', rmResult));
      await this.appendLog(event, toLogEntry('start_container', runResult));
      await this.appendLog(event, toLogEntry('list_containers', psResult));

      if (runResult.exitCode !== 0) {
        await this.fail(
          event,
          `docker run failed: ${runResult.stderr || runResult.stdout || 'unknown error'}`,
        );
        return;
      }

      const { containers } = parseDockerPsOutput(psResult.stdout);
      const recreated = containers.find((container) => container.names === config.containerName);
      const newStatus = recreated
        ? classifyContainerStatus(recreated.status)
        : ServiceStatus.UNKNOWN;

      await this.appendLog(event, {
        timestamp: new Date().toISOString(),
        step: 'post_rollback_health_check',
        message: recreated
          ? `Container "${config.containerName}" classified as ${newStatus}`
          : `Container "${config.containerName}" not found in docker ps -a output after recreation`,
      });

      if (newStatus !== ServiceStatus.RUNNING || !recreated) {
        await this.fail(
          event,
          `Post-rollback health check failed: container status is "${newStatus}"`,
        );
        return;
      }

      await this.succeed(event, service, host, recreated.id, targetSnapshot, newStatus);
    } finally {
      privateKey = '';
    }
  }

  private async succeed(
    event: RollbackEvent,
    service: Service,
    host: Host,
    newContainerId: string,
    targetSnapshot: DeploymentSnapshot,
    newStatus: ServiceStatus,
  ): Promise<void> {
    const { image, tag } = splitImageAndTag(targetSnapshot.imageTag);

    service.containerId = newContainerId;
    service.image = image;
    service.currentTag = tag;
    service.status = newStatus;
    service.lastCheckedAt = new Date();
    await this.serviceRepository.save(service);

    const config = this.deploymentSnapshotsService.decryptConfig(targetSnapshot);
    await this.deploymentSnapshotsService.createSnapshot({
      serviceId: service.id,
      imageTag: targetSnapshot.imageTag,
      config,
      deployedAt: new Date(),
      deployedById: event.triggeredById,
    });

    await this.healthCheckLogService.write({
      entityType: HealthCheckEntityType.SERVICE,
      entityId: service.id,
      status: newStatus,
      rawOutput: {
        reason: 'rollback',
        rollback_event_id: event.id,
        image_tag: targetSnapshot.imageTag,
      },
    });

    event.status = RollbackEventStatus.SUCCEEDED;
    event.completedAt = new Date();
    await this.rollbackEventRepository.save(event);

    this.logger.debug(
      `Rollback ${event.id} succeeded for service ${service.id} on host ${host.id} -> ${targetSnapshot.imageTag}`,
    );
  }

  private async fail(event: RollbackEvent, reason: string): Promise<void> {
    this.logger.error(`Rollback ${event.id} failed: ${reason}`);
    await this.appendLog(event, {
      timestamp: new Date().toISOString(),
      step: 'failure',
      message: reason,
    });
    event.status = RollbackEventStatus.FAILED;
    event.completedAt = new Date();
    await this.rollbackEventRepository.save(event);
  }

  private async appendLog(event: RollbackEvent, entry: RollbackLogEntry): Promise<void> {
    event.logOutput = [...(event.logOutput ?? []), entry];
    await this.rollbackEventRepository.save(event);
  }
}

function toLogEntry(step: string, result: SshCommandResult): RollbackLogEntry {
  return {
    timestamp: new Date().toISOString(),
    step,
    command: result.command,
    exit_code: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
