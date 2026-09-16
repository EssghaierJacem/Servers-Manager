import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { CryptoService } from '../crypto/crypto.service';
import { HEALTH_CHECK_JOB, HEALTH_CHECK_QUEUE } from '../health-check/health-check.constants';
import { HealthCheckJobData } from '../health-check/health-check-job.interface';
import { CreateHostDto } from './dto/create-host.dto';
import { HealthCheckLog } from './entities/health-check-log.entity';
import { DEFAULT_SSH_PORT, Host, HostStatus } from './entities/host.entity';

const RECENT_LOGS_LIMIT = 20;

export interface OverviewCounts {
  total_hosts: number;
  healthy: number;
  degraded: number;
  unreachable: number;
  unknown: number;
}

@Injectable()
export class HostsService {
  constructor(
    @InjectRepository(Host)
    private readonly hostRepository: Repository<Host>,
    @InjectRepository(HealthCheckLog)
    private readonly healthCheckLogRepository: Repository<HealthCheckLog>,
    private readonly cryptoService: CryptoService,
    @InjectQueue(HEALTH_CHECK_QUEUE)
    private readonly healthCheckQueue: Queue<HealthCheckJobData>,
  ) {}

  async create(orgId: string, dto: CreateHostDto): Promise<Host> {
    const sshKeyEncrypted = this.cryptoService.encrypt(dto.ssh_private_key);

    const host = this.hostRepository.create({
      orgId,
      name: dto.name,
      provider: dto.provider,
      ipAddress: dto.ip_address,
      sshPort: dto.ssh_port ?? DEFAULT_SSH_PORT,
      sshUser: dto.ssh_user,
      sshKeyEncrypted,
      status: HostStatus.UNKNOWN,
      lastCheckedAt: null,
    });

    return this.hostRepository.save(host);
  }

  findAllForOrg(orgId: string): Promise<Host[]> {
    return this.hostRepository.find({ where: { orgId }, order: { createdAt: 'DESC' } });
  }

  async findOneForOrgOrThrow(orgId: string, id: string): Promise<Host> {
    const host = await this.hostRepository.findOne({ where: { id, orgId } });
    if (!host) {
      throw new NotFoundException(`Host ${id} not found`);
    }
    return host;
  }

  async getRecentLogs(hostId: string): Promise<HealthCheckLog[]> {
    return this.healthCheckLogRepository.find({
      where: { hostId },
      order: { checkedAt: 'DESC' },
      take: RECENT_LOGS_LIMIT,
    });
  }

  async remove(orgId: string, id: string): Promise<void> {
    const host = await this.findOneForOrgOrThrow(orgId, id);
    await this.hostRepository.remove(host);
  }

  async enqueueCheck(orgId: string, id: string): Promise<string> {
    await this.findOneForOrgOrThrow(orgId, id);

    const job = await this.healthCheckQueue.add(
      HEALTH_CHECK_JOB,
      { hostId: id },
      { removeOnComplete: true, removeOnFail: 50 },
    );

    return job.id as string;
  }

  async getOverview(orgId: string): Promise<OverviewCounts> {
    const hosts = await this.hostRepository.find({ where: { orgId } });

    const byStatus: Record<HostStatus, number> = {
      [HostStatus.HEALTHY]: 0,
      [HostStatus.DEGRADED]: 0,
      [HostStatus.UNREACHABLE]: 0,
      [HostStatus.UNKNOWN]: 0,
    };

    for (const host of hosts) {
      byStatus[host.status] += 1;
    }

    return {
      total_hosts: hosts.length,
      healthy: byStatus[HostStatus.HEALTHY],
      degraded: byStatus[HostStatus.DEGRADED],
      unreachable: byStatus[HostStatus.UNREACHABLE],
      unknown: byStatus[HostStatus.UNKNOWN],
    };
  }
}
