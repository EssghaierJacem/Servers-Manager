import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isDockerMissing } from '../common/utils/docker.util';
import { SshCommandResult } from '../ssh/ssh.service';
import { Host } from '../hosts/entities/host.entity';
import { HealthCheckEntityType } from '../health-check-log/entities/health-check-log.entity';
import { HealthCheckLogService } from '../health-check-log/health-check-log.service';
import { classifyContainerStatus } from './container-status-classifier';
import { DockerPsContainer, parseDockerPsOutput, splitImageAndTag } from './docker-ps-parser';
import { Service, ServiceStatus } from './entities/service.entity';

/**
 * Turns the `docker ps -a` output already fetched during a host's health
 * check into Service rows. Runs inside that same job/SSH session - it does
 * not open a connection of its own (see HealthCheckProcessor).
 */
@Injectable()
export class ServicesSyncService {
  private readonly logger = new Logger(ServicesSyncService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly healthCheckLogService: HealthCheckLogService,
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
