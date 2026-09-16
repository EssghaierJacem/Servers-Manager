import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { In, QueryFailedError, Repository } from 'typeorm';
import { DeploymentSnapshotsService } from '../deployment-snapshots/deployment-snapshots.service';
import { ServicesService } from '../services/services.service';
import { RollbackEvent, RollbackEventStatus } from './entities/rollback-event.entity';
import { RollbackJobData } from './rollback-job.interface';
import { ROLLBACK_EVENTS_LIST_LIMIT, ROLLBACK_JOB, ROLLBACK_QUEUE } from './rollback.constants';

const ACTIVE_STATUSES = [RollbackEventStatus.PENDING, RollbackEventStatus.IN_PROGRESS];
const UNIQUE_VIOLATION_CODE = '23505';

@Injectable()
export class RollbackService {
  constructor(
    @InjectRepository(RollbackEvent)
    private readonly rollbackEventRepository: Repository<RollbackEvent>,
    private readonly servicesService: ServicesService,
    private readonly deploymentSnapshotsService: DeploymentSnapshotsService,
    @InjectQueue(ROLLBACK_QUEUE)
    private readonly rollbackQueue: Queue<RollbackJobData>,
  ) {}

  /**
   * Validates the target snapshot belongs to this service, rejects a
   * rollback while one is already in flight for it, then creates the
   * RollbackEvent row (status: pending) synchronously before enqueuing the
   * job - so the caller's 202 response always carries a real, pollable id.
   */
  async enqueueRollback(
    orgId: string,
    serviceId: string,
    targetSnapshotId: string,
    triggeredByUserId: string,
  ): Promise<RollbackEvent> {
    const service = await this.servicesService.findOneForOrgOrThrow(orgId, serviceId);

    const targetSnapshot = await this.deploymentSnapshotsService.findOneForServiceOrThrow(
      service.id,
      targetSnapshotId,
    );

    const currentSnapshot = await this.deploymentSnapshotsService.findCurrentForService(service.id);
    if (!currentSnapshot) {
      throw new BadRequestException(
        `Service ${service.id} has no deployment history yet; nothing to roll back from`,
      );
    }

    const activeRollback = await this.rollbackEventRepository.findOne({
      where: { serviceId: service.id, status: In(ACTIVE_STATUSES) },
    });
    if (activeRollback) {
      throw new ConflictException(
        `A rollback is already ${activeRollback.status} for service ${service.id}`,
      );
    }

    try {
      const event = await this.rollbackEventRepository.save(
        this.rollbackEventRepository.create({
          serviceId: service.id,
          fromSnapshotId: currentSnapshot.id,
          toSnapshotId: targetSnapshot.id,
          triggeredById: triggeredByUserId,
          status: RollbackEventStatus.PENDING,
          logOutput: [],
        }),
      );

      await this.rollbackQueue.add(
        ROLLBACK_JOB,
        { rollbackEventId: event.id },
        { removeOnComplete: true, removeOnFail: 50 },
      );

      return event;
    } catch (error) {
      // Belt-and-suspenders against a race between the findOne check above
      // and this insert: a partial unique index (see the migration) makes
      // a second concurrent "active rollback" for the same service a DB
      // constraint violation, not just an application-level check.
      if (isUniqueViolation(error)) {
        throw new ConflictException(`A rollback is already in progress for service ${service.id}`);
      }
      throw error;
    }
  }

  async findOneForOrgOrThrow(orgId: string, id: string): Promise<RollbackEvent> {
    const event = await this.rollbackEventRepository
      .createQueryBuilder('event')
      .innerJoin('event.service', 'service')
      .where('event.id = :id', { id })
      .andWhere('service.org_id = :orgId', { orgId })
      .getOne();

    if (!event) {
      throw new NotFoundException(`Rollback event ${id} not found`);
    }
    return event;
  }

  listForOrg(orgId: string): Promise<RollbackEvent[]> {
    return this.rollbackEventRepository
      .createQueryBuilder('event')
      .innerJoin('event.service', 'service')
      .where('service.org_id = :orgId', { orgId })
      .orderBy('event.initiatedAt', 'DESC')
      .take(ROLLBACK_EVENTS_LIST_LIMIT)
      .getMany();
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error as QueryFailedError & { code?: string }).code === UNIQUE_VIOLATION_CODE
  );
}
