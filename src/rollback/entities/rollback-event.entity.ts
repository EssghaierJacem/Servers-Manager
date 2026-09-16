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
import { DeploymentSnapshot } from '../../deployment-snapshots/entities/deployment-snapshot.entity';
import { User } from '../../users/entities/user.entity';

export enum RollbackEventStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export interface RollbackLogEntry {
  timestamp: string;
  step: string;
  command?: string;
  exit_code?: number | null;
  stdout?: string;
  stderr?: string;
  message?: string;
}

/**
 * An immutable audit record of one rollback attempt. Rows are never
 * updated after `completed_at` is set - a failed rollback is a fact about
 * what was tried, not something to overwrite with a retry (there is no
 * retry; see RollbackProcessor).
 */
@Entity('rollback_events')
@Index(['serviceId'])
export class RollbackEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'from_snapshot_id' })
  fromSnapshotId: string;

  @ManyToOne(() => DeploymentSnapshot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_snapshot_id' })
  fromSnapshot: DeploymentSnapshot;

  @Column({ name: 'to_snapshot_id' })
  toSnapshotId: string;

  @ManyToOne(() => DeploymentSnapshot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_snapshot_id' })
  toSnapshot: DeploymentSnapshot;

  @Column({ name: 'triggered_by' })
  triggeredById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'triggered_by' })
  triggeredBy: User;

  @Column({ type: 'enum', enum: RollbackEventStatus, default: RollbackEventStatus.PENDING })
  status: RollbackEventStatus;

  @Column({ name: 'log_output', type: 'jsonb', default: () => "'[]'" })
  logOutput: RollbackLogEntry[];

  @CreateDateColumn({ name: 'initiated_at' })
  initiatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}
