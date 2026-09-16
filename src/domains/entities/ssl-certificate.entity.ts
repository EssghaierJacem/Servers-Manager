import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Domain } from './domain.entity';

export enum SslCertificateStatus {
  UNKNOWN = 'unknown',
  VALID = 'valid',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
  INVALID = 'invalid',
}

/**
 * Holds only the latest certificate state per domain (one-to-one), not a
 * history - the full history of check outcomes lives in HealthCheckLog.
 */
@Entity('ssl_certificates')
export class SSLCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'domain_id', unique: true })
  domainId: string;

  @OneToOne(() => Domain, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'domain_id' })
  domain: Domain;

  @Column({ type: 'varchar', nullable: true })
  issuer: string | null;

  @Column({ name: 'valid_from', type: 'timestamptz', nullable: true })
  validFrom: Date | null;

  @Column({ name: 'valid_to', type: 'timestamptz', nullable: true })
  validTo: Date | null;

  @Column({ type: 'enum', enum: SslCertificateStatus, default: SslCertificateStatus.UNKNOWN })
  status: SslCertificateStatus;

  @Column({ name: 'last_checked_at', type: 'timestamptz', nullable: true })
  lastCheckedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
