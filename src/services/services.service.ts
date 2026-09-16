import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HealthCheckEntityType,
  HealthCheckLog,
} from '../health-check-log/entities/health-check-log.entity';
import { HealthCheckLogService } from '../health-check-log/health-check-log.service';
import { HostsService } from '../hosts/hosts.service';
import { Service, ServiceStatus } from './entities/service.entity';

export interface ServiceOverviewCounts {
  services_total: number;
  running: number;
  unhealthy: number;
  stopped: number;
  crash_loop: number;
  // Named services_unknown (not the bare "unknown" the endpoint's field list
  // literally names) because /overview already has a host-status "unknown"
  // field from Phase 1 - spreading both into one flat response would let
  // one silently clobber the other. Every other service field name is
  // already unambiguous (hosts/domains have no "running"/"crash_loop"/etc).
  services_unknown: number;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly healthCheckLogService: HealthCheckLogService,
    private readonly hostsService: HostsService,
  ) {}

  async findAllForHost(orgId: string, hostId: string): Promise<Service[]> {
    await this.hostsService.findOneForOrgOrThrow(orgId, hostId);
    return this.serviceRepository.find({ where: { hostId }, order: { containerName: 'ASC' } });
  }

  async findOneForOrgOrThrow(orgId: string, id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id, orgId } });
    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }
    return service;
  }

  getRecentLogs(serviceId: string): Promise<HealthCheckLog[]> {
    return this.healthCheckLogService.findRecent([HealthCheckEntityType.SERVICE], serviceId);
  }

  async enqueueCheck(orgId: string, id: string): Promise<string> {
    const service = await this.findOneForOrgOrThrow(orgId, id);
    return this.hostsService.enqueueCheck(orgId, service.hostId);
  }

  async getOverview(orgId: string): Promise<ServiceOverviewCounts> {
    const services = await this.serviceRepository.find({ where: { orgId } });

    const byStatus: Record<ServiceStatus, number> = {
      [ServiceStatus.RUNNING]: 0,
      [ServiceStatus.UNHEALTHY]: 0,
      [ServiceStatus.STOPPED]: 0,
      [ServiceStatus.CRASH_LOOP]: 0,
      [ServiceStatus.UNKNOWN]: 0,
    };

    for (const service of services) {
      byStatus[service.status] += 1;
    }

    return {
      services_total: services.length,
      running: byStatus[ServiceStatus.RUNNING],
      unhealthy: byStatus[ServiceStatus.UNHEALTHY],
      stopped: byStatus[ServiceStatus.STOPPED],
      crash_loop: byStatus[ServiceStatus.CRASH_LOOP],
      services_unknown: byStatus[ServiceStatus.UNKNOWN],
    };
  }
}
