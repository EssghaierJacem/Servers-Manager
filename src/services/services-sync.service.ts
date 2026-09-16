import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isDockerMissing } from '../common/utils/docker.util';
import { SshCommandResult, SshConnectionService } from '../ssh/ssh.service';
import { CryptoService } from '../crypto/crypto.service';
import { Host } from '../hosts/entities/host.entity';
import { HealthCheckEntityType } from '../health-check-log/entities/health-check-log.entity';
import { HealthCheckLogService } from '../health-check-log/health-check-log.service';
import { DeploymentSnapshotsService } from '../deployment-snapshots/deployment-snapshots.service';
import { parseDockerInspectOutput } from '../deployment-snapshots/docker-inspect-parser';
import { AlertEvaluationService } from '../alerts/alert-evaluation.service';
import { AlertEntityType } from '../alerts/entities/alert-rule.entity';
import { classifyContainerStatus } from './container-status-classifier';
import { DockerPsContainer, parseDockerPsOutput, splitImageAndTag } from './docker-ps-parser';
import { Service, ServiceStatus } from './entities/service.entity';

const DOCKER_INSPECT_COMMAND_PREFIX = 'docker inspect';

/**
 * Turns the `docker ps -a` output already fetched during a host's health
 * check into Service rows. Runs inside that same job/SSH session - it does
 * not open a connection of its own for the ps-based sync (see
 * HealthCheckProcessor). It *does* open one extra short-lived connection,
 * via the same shared SshConnectionService, but only on the rare tick
 * where a service's image/tag actually changed - `docker inspect` output
 * wasn't part of Phase 3's existing SSH round trip, so there's nothing to
 * reuse for it.
 */
@Injectable()
export class ServicesSyncService {
  private readonly logger = new Logger(ServicesSyncService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly healthCheckLogService: HealthCheckLogService,
    private readonly deploymentSnapshotsService: DeploymentSnapshotsService,
    private readonly sshConnectionService: SshConnectionService,
    private readonly cryptoService: CryptoService,
    private readonly alertEvaluationService: AlertEvaluationService,
  ) {}

  async sync(host: Host, dockerPsResult: SshCommandResult): Promise<void> {
    if (isDockerMissing(dockerPsResult)) {
      this.logger.debug(`Docker not installed on host ${host.id}; skipping service sync`);
      return;
    }

    const { containers, skippedLines } = parseDockerPsOutput(dockerPsResult.stdout);
    if (skippedLines > 0) {
      this.logger.warn(`Skipped ${skippedLines} unparseable docker ps line(s) for host ${host.id}`);
    }

    const now = new Date();
    const seenContainerIds = new Set<string>();

    for (const container of containers) {
      seenContainerIds.add(container.id);
      await this.upsertService(host, container, now);
    }

    await this.markMissingServicesUnknown(host, seenContainerIds, now);

    this.logger.debug(`Synced ${containers.length} service(s) for host ${host.id} (${host.name})`);
  }

  private async upsertService(
    host: Host,
    container: DockerPsContainer,
    checkedAt: Date,
  ): Promise<void> {
    const { image, tag } = splitImageAndTag(container.image);
    const status = classifyContainerStatus(container.status);

    let service = await this.serviceRepository.findOne({
      where: { hostId: host.id, containerId: container.id },
    });

    if (!service) {
      service = this.serviceRepository.create({
        orgId: host.orgId,
        hostId: host.id,
        containerId: container.id,
      });
    }

    const previousStatus = service.status ?? ServiceStatus.UNKNOWN;

    service.containerName = container.names;
    service.image = image;
    service.currentTag = tag;
    service.status = status;
    service.portMappings = container.ports ? { raw: container.ports } : null;
    service.lastCheckedAt = checkedAt;

    const saved = await this.serviceRepository.save(service);

    await this.healthCheckLogService.write({
      entityType: HealthCheckEntityType.SERVICE,
      entityId: saved.id,
      status,
      rawOutput: {
        container_id: container.id,
        names: container.names,
        image: container.image,
        status: container.status,
        ports: container.ports,
      },
    });

    await this.alertEvaluationService.evaluateTransition({
      orgId: host.orgId,
      entityType: AlertEntityType.SERVICE,
      entityId: saved.id,
      previousStatus,
      newStatus: saved.status,
    });

    await this.captureSnapshotIfImageChanged(host, saved, container);
  }

  /**
   * Compares this run's full image reference against the service's last
   * known snapshot. A mismatch (including "no snapshot yet") means a
   * deploy happened since we last looked, so a fresh DeploymentSnapshot is
   * captured - automatically, deployed_by stays null.
   */
  private async captureSnapshotIfImageChanged(
    host: Host,
    service: Service,
    container: DockerPsContainer,
  ): Promise<void> {
    const currentSnapshot = await this.deploymentSnapshotsService.findCurrentForService(service.id);
    if (currentSnapshot?.imageTag === container.image) {
      return;
    }

    let privateKey: string;
    try {
      privateKey = this.cryptoService.decrypt(host.sshKeyEncrypted);
    } catch (error) {
      this.logger.error(
        `Failed to decrypt SSH key for host ${host.id} while capturing a snapshot for service ${service.id}: ${(error as Error).message}`,
      );
      return;
    }

    try {
      const [inspectResult] = await this.sshConnectionService.runCommands(
        {
          host: host.ipAddress,
          port: host.sshPort,
          username: host.sshUser,
          privateKey,
        },
        [`${DOCKER_INSPECT_COMMAND_PREFIX} ${container.id}`],
      );

      if (inspectResult.exitCode !== 0) {
        this.logger.warn(
          `docker inspect failed for container ${container.id} on host ${host.id}: ${inspectResult.stderr}`,
        );
        return;
      }

      const config = parseDockerInspectOutput(inspectResult.stdout);
      if (!config) {
        this.logger.warn(
          `Could not parse docker inspect output for container ${container.id} on host ${host.id}`,
        );
        return;
      }

      await this.deploymentSnapshotsService.createSnapshot({
        serviceId: service.id,
        imageTag: container.image,
        config,
        deployedAt: new Date(),
        deployedById: null,
      });

      this.logger.debug(
        `Captured new deployment snapshot for service ${service.id}: ${container.image}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to capture deployment snapshot for service ${service.id} on host ${host.id}: ${(error as Error).message}`,
      );
    } finally {
      privateKey = '';
    }
  }

  /**
   * A Service row whose container no longer appears in this run's output
   * is explicitly marked `unknown` (rather than left stale with no
   * indication anything changed) - the container may have been removed
   * entirely. Rows already `unknown` are left alone so a long-gone
   * container doesn't get re-written and re-logged on every tick forever.
   */
  private async markMissingServicesUnknown(
    host: Host,
    seenContainerIds: Set<string>,
    checkedAt: Date,
  ): Promise<void> {
    const existingServices = await this.serviceRepository.find({ where: { hostId: host.id } });
    const missing = existingServices.filter(
      (service) =>
        !seenContainerIds.has(service.containerId) && service.status !== ServiceStatus.UNKNOWN,
    );

    for (const service of missing) {
      service.status = ServiceStatus.UNKNOWN;
      service.lastCheckedAt = checkedAt;
      const saved = await this.serviceRepository.save(service);

      await this.healthCheckLogService.write({
        entityType: HealthCheckEntityType.SERVICE,
        entityId: saved.id,
        status: ServiceStatus.UNKNOWN,
        rawOutput: { reason: 'Container no longer present in docker ps -a output' },
      });
    }
  }
}
