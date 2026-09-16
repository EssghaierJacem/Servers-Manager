import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * What kind of entity a log row is about. Extend this enum (and nothing
 * else) when a new checkable resource type is introduced rather than
 * adding a parallel logging table.
 */
export enum HealthCheckEntityType {
  HOST = 'host',
  DOMAIN = 'domain',
  SSL_CERTIFICATE = 'ssl_certificate',
  SERVICE = 'service',
}

/**
 * A single polymorphic, timestamped audit entry for any check the system
 * runs (SSH host health, domain DNS/WHOIS, TLS certificate inspection).
 * `entityType` + `entityId` identify what was checked; `status` is a
 * free-text outcome label whose vocabulary is owned by whichever checker
 * wrote it (see HealthCheckStatus for hosts, DomainDnsStatus /
 * SslCertificateStatus for domains) rather than a single DB-wide enum that
 * would have to grow every time a new check type is added.
 */
@Entity('health_check_logs')
@Index(['entityType', 'entityId'])
export class HealthCheckLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', type: 'enum', enum: HealthCheckEntityType })
  entityType: HealthCheckEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ name: 'raw_output', type: 'jsonb' })
  rawOutput: Record<string, unknown>;

  @CreateDateColumn({ name: 'checked_at' })
  checkedAt: Date;
}
