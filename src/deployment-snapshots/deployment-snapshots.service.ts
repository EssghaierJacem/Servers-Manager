import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CryptoService } from '../crypto/crypto.service';
import { DeploymentConfigBlob } from './deployment-config-blob.interface';
import { DeploymentSnapshot } from './entities/deployment-snapshot.entity';

export interface CreateSnapshotInput {
  serviceId: string;
  imageTag: string;
  config: DeploymentConfigBlob;
  deployedAt: Date;
  /** User id when captured via a manual rollback, null for an automatic capture. */
  deployedById: string | null;
}

/**
 * Owns the DeploymentSnapshot table: creating snapshots (encrypting the
 * config blob via the same CryptoService that already encrypts SSH keys),
 * flipping is_current atomically, and reading history. Knows nothing about
 * Service/Host beyond a serviceId, so both ServicesSyncService (Phase 3)
 * and the rollback job can depend on it without a circular import.
 */
@Injectable()
export class DeploymentSnapshotsService {
  constructor(
    @InjectRepository(DeploymentSnapshot)
    private readonly snapshotRepository: Repository<DeploymentSnapshot>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly cryptoService: CryptoService,
  ) {}

  findCurrentForService(serviceId: string): Promise<DeploymentSnapshot | null> {
    return this.snapshotRepository.findOne({ where: { serviceId, isCurrent: true } });
  }

  findHistoryForService(serviceId: string): Promise<DeploymentSnapshot[]> {
    return this.snapshotRepository.find({
      where: { serviceId },
      order: { deployedAt: 'DESC' },
    });
  }

  async findOneForServiceOrThrow(serviceId: string, id: string): Promise<DeploymentSnapshot> {
    const snapshot = await this.snapshotRepository.findOne({ where: { id, serviceId } });
    if (!snapshot) {
      throw new BadRequestException(`Snapshot ${id} does not belong to service ${serviceId}`);
    }
    return snapshot;
  }

  decryptConfig(snapshot: DeploymentSnapshot): DeploymentConfigBlob {
    return JSON.parse(this.cryptoService.decrypt(snapshot.configBlob)) as DeploymentConfigBlob;
  }

  /**
   * Creates a new snapshot and flips the previous current one to false in
   * the same transaction, so exactly one row per service is ever current.
   */
  async createSnapshot(input: CreateSnapshotInput): Promise<DeploymentSnapshot> {
    return this.dataSource.transaction(async (manager) => {
      await manager.update(
        DeploymentSnapshot,
        { serviceId: input.serviceId, isCurrent: true },
        { isCurrent: false },
      );

      const snapshot = manager.create(DeploymentSnapshot, {
        serviceId: input.serviceId,
        imageTag: input.imageTag,
        configBlob: this.cryptoService.encrypt(JSON.stringify(input.config)),
        deployedAt: input.deployedAt,
        deployedById: input.deployedById,
        isCurrent: true,
      });

      return manager.save(snapshot);
    });
  }
}
