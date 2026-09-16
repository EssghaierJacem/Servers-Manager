import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

/**
 * What kind of entity a rule matches against. Broader than
 * HealthCheckEntityType (adds rollback_event and system) since alerting
 * covers things - a failed rollback, an aggregate insight - that aren't
 * per-check audit log entries.
 */
export enum AlertEntityType {
  HOST = 'host',
  DOMAIN = 'domain',
  SSL_CERTIFICATE = 'ssl_certificate',
  SERVICE = 'service',
  ROLLBACK_EVENT = 'rollback_event',
  SYSTEM = 'system',
}

export enum AlertChannel {
  SLACK = 'slack',
  EMAIL = 'email',
}

const DEFAULT_COOLDOWN_MINUTES = 30;

/**
 * A user-configured "when X happens, notify Y" rule. `condition` is one of
 * the fixed ALERT_CONDITIONS strings, validated at the DTO layer rather
 * than as a DB enum, matching how HealthCheckLog.status stayed a free
 * varchar instead of a DB-wide enum for the same flexibility reasons.
 */
@Entity('alert_rules')
@Index(['orgId', 'entityType', 'condition'])
export class AlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column()
  name: string;

  @Column({ name: 'entity_type', type: 'enum', enum: AlertEntityType })
  entityType: AlertEntityType;

  @Column({ type: 'varchar' })
  condition: string;

  @Column({ type: 'enum', enum: AlertChannel })
  channel: AlertChannel;

  /** AES-256-GCM ciphertext (via CryptoService) of a JSON channel config, e.g. { webhook_url }. */
  @Column({ name: 'channel_config_encrypted', type: 'text' })
  channelConfigEncrypted: string;

  @Column({ name: 'cooldown_minutes', type: 'int', default: DEFAULT_COOLDOWN_MINUTES })
  cooldownMinutes: number;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
