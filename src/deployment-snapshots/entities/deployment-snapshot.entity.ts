import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Service } from '../../services/entities/service.entity';
import { User } from '../../users/entities/user.entity';

/**
 * A record of a container's deployed image/config at one point in time.
 * `deployedById` is null when captured automatically by the service sync
 * (the container's tag just changed) and set to the triggering user when
 * captured as the result of a manual rollback.
 *
 * Only one row per service should have `isCurrent: true` - enforced by
 * DeploymentSnapshotsService.createSnapshot flipping the previous one in
 * the same transaction, backed by the partial unique index below as a
 * safety net against races.
 */
@Entity('deployment_snapshots')
@Index(['serviceId'])
export class DeploymentSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'image_tag', type: 'varchar' })
  imageTag: string;

  /** AES-256-GCM ciphertext (via CryptoService) of a JSON DeploymentConfigBlob. */
  @Column({ name: 'config_blob', type: 'text' })
  configBlob: string;

  @Column({ name: 'deployed_at', type: 'timestamptz' })
  deployedAt: Date;

  @Column({ name: 'deployed_by', type: 'uuid', nullable: true })
  deployedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'deployed_by' })
  deployedBy: User | null;

  @Column({ name: 'is_current', default: false })
  isCurrent: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
