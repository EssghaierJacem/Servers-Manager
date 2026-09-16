import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Host } from './host.entity';

export enum HealthCheckStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNREACHABLE = 'unreachable',
}

@Entity('health_check_logs')
export class HealthCheckLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'host_id' })
  hostId: string;

  @ManyToOne(() => Host, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_id' })
  host: Host;

  @Column({ type: 'enum', enum: HealthCheckStatus })
  status: HealthCheckStatus;

  @Column({ name: 'raw_output', type: 'jsonb' })
  rawOutput: Record<string, unknown>;

  @CreateDateColumn({ name: 'checked_at' })
  checkedAt: Date;
}
