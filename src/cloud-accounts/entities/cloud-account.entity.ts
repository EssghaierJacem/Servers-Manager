import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum CloudProvider {
  VERCEL = 'vercel',
  RENDER = 'render',
  AWS = 'aws',
  AZURE = 'azure',
  GCP = 'gcp',
  OVH = 'ovh',
  CLOUDFLARE = 'cloudflare',
}

/**
 * One row per org+provider connection. Storing an API key today is a stand-in
 * for real OAuth (each provider needs its own registered app/callback) - cost
 * and resource sync against the provider's billing API is a later phase.
 */
@Entity('cloud_accounts')
@Index(['orgId', 'provider'], { unique: true })
export class CloudAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ type: 'enum', enum: CloudProvider })
  provider: CloudProvider;

  @Column()
  label: string;

  @Column({ name: 'api_key_encrypted', type: 'text' })
  apiKeyEncrypted: string;

  @Column({ name: 'connected_at', type: 'timestamptz' })
  connectedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
