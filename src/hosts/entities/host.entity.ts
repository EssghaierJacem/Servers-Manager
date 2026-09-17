import { Organization } from '../../organizations/entities/organization.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum HostProvider {
  AZURE = 'azure',
  VMWARE = 'vmware',
  OVH = 'ovh',
  AWS = 'aws',
  DIGITALOCEAN = 'digitalocean',
  BARE_METAL = 'bare_metal',
  OTHER = 'other',
}

export enum HostStatus {
  UNKNOWN = 'unknown',
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNREACHABLE = 'unreachable',
  PENDING_SETUP = 'pending_setup',
}

export const DEFAULT_SSH_PORT = 22;

@Entity('hosts')
export class Host {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: HostProvider })
  provider: HostProvider;

  @Column({ name: 'ip_address' })
  ipAddress: string;

  @Column({ name: 'ssh_port', default: DEFAULT_SSH_PORT })
  sshPort: number;

  @Column({ name: 'ssh_user' })
  sshUser: string;

  @Column({ name: 'ssh_key_encrypted', type: 'text' })
  sshKeyEncrypted: string;

  @Column({ name: 'ssh_public_key', type: 'text' })
  sshPublicKey: string;

  @Column({ type: 'enum', enum: HostStatus, default: HostStatus.UNKNOWN })
  status: HostStatus;

  @Column({ name: 'last_checked_at', type: 'timestamptz', nullable: true })
  lastCheckedAt: Date | null;

  @Column({ name: 'setup_verified_at', type: 'timestamptz', nullable: true })
  setupVerifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
