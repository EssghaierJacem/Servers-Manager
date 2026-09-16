import { Organization } from '../../organizations/entities/organization.entity';
import { Host } from '../../hosts/entities/host.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ServiceStatus {
  UNKNOWN = 'unknown',
  RUNNING = 'running',
  UNHEALTHY = 'unhealthy',
  STOPPED = 'stopped',
  CRASH_LOOP = 'crash_loop',
}

/**
 * One row per container discovered on a host via `docker ps -a`. Rows are
 * upserted by (host_id, container_id) during the host's existing health
 * check - never created directly (there is no POST /services).
 */
@Entity('services')
@Index(['hostId', 'containerId'], { unique: true })
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'host_id' })
  hostId: string;

  @ManyToOne(() => Host, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_id' })
  host: Host;

  @Column({ name: 'container_id' })
  containerId: string;

  @Column({ name: 'container_name' })
  containerName: string;

  @Column({ type: 'varchar' })
  image: string;

  @Column({ name: 'current_tag', type: 'varchar', nullable: true })
  currentTag: string | null;

  @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.UNKNOWN })
  status: ServiceStatus;

  @Column({ name: 'port_mappings', type: 'jsonb', nullable: true })
  portMappings: Record<string, unknown> | null;

  @Column({ name: 'last_checked_at', type: 'timestamptz' })
  lastCheckedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
