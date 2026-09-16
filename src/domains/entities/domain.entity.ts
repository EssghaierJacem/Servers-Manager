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

export enum DomainDnsStatus {
  UNKNOWN = 'unknown',
  RESOLVING = 'resolving',
  NOT_RESOLVING = 'not_resolving',
}

@Entity('domains')
@Index(['orgId', 'hostname'], { unique: true })
export class Domain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'host_id', type: 'uuid', nullable: true })
  hostId: string | null;

  @ManyToOne(() => Host, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'host_id' })
  host: Host | null;

  @Column()
  hostname: string;

  @Column({ type: 'varchar', nullable: true })
  registrar: string | null;

  @Column({ name: 'domain_expires_at', type: 'timestamptz', nullable: true })
  domainExpiresAt: Date | null;

  @Column({
    name: 'dns_status',
    type: 'enum',
    enum: DomainDnsStatus,
    default: DomainDnsStatus.UNKNOWN,
  })
  dnsStatus: DomainDnsStatus;

  @Column({ name: 'resolved_ip', type: 'varchar', nullable: true })
  resolvedIp: string | null;

  @Column({ name: 'last_checked_at', type: 'timestamptz', nullable: true })
  lastCheckedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
