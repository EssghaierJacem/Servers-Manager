import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum InsightFlag {
  IDLE_HOST = 'idle_host',
  ORPHANED_DOMAIN = 'orphaned_domain',
  ORPHANED_HOST = 'orphaned_host',
}

/**
 * Persists whether a given entity matched an insight heuristic (idle host,
 * orphaned domain/host) as of the last daily InsightsService run, so the
 * next run can tell "newly matching" apart from "still matching" without
 * re-deriving history from scratch. Deliberately a small generic
 * (entity_id, flag) -> active table rather than bolting an ad-hoc boolean
 * column onto Host/Domain for each new heuristic.
 */
@Entity('insight_states')
@Index(['entityId', 'flag'], { unique: true })
export class InsightState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ type: 'enum', enum: InsightFlag })
  flag: InsightFlag;

  @Column()
  active: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
