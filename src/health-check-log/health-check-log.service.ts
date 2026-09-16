import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthCheckEntityType, HealthCheckLog } from './entities/health-check-log.entity';

export const RECENT_LOGS_LIMIT = 20;

export interface WriteHealthCheckLogInput {
  entityType: HealthCheckEntityType;
  entityId: string;
  status: string;
  rawOutput: Record<string, unknown>;
}

/**
 * Single write/read path for the polymorphic health-check audit trail.
 * Both the host health-check processor and the domain-check processor go
 * through this instead of touching the HealthCheckLog repository directly.
 */
@Injectable()
export class HealthCheckLogService {
  constructor(
    @InjectRepository(HealthCheckLog)
    private readonly healthCheckLogRepository: Repository<HealthCheckLog>,
  ) {}

  async write(input: WriteHealthCheckLogInput): Promise<HealthCheckLog> {
    return this.healthCheckLogRepository.save(this.healthCheckLogRepository.create(input));
  }

  findRecent(
    entityTypes: HealthCheckEntityType[],
    entityId: string,
    limit: number = RECENT_LOGS_LIMIT,
  ): Promise<HealthCheckLog[]> {
    return this.healthCheckLogRepository
      .createQueryBuilder('log')
      .where('log.entity_type IN (:...entityTypes)', { entityTypes })
      .andWhere('log.entity_id = :entityId', { entityId })
      .orderBy('log.checked_at', 'DESC')
      .take(limit)
      .getMany();
  }
}
