import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlertRule, AlertEntityType } from './alert-rule.entity';

export enum AlertDeliveryStatus {
  SENT = 'sent',
  FAILED = 'failed',
}

/**
 * An immutable record of one alert delivery attempt - success or failure -
 * same audit-trail spirit as RollbackEvent. Also the source of truth the
 * cooldown check reads from (a `sent` row within the rule's cooldown
 * window for the same entity suppresses a repeat send).
 */
@Entity('alert_logs')
@Index(['alertRuleId', 'entityId'])
export class AlertLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alert_rule_id' })
  alertRuleId: string;

  @ManyToOne(() => AlertRule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'alert_rule_id' })
  alertRule: AlertRule;

  @Column({ name: 'entity_type', type: 'enum', enum: AlertEntityType })
  entityType: AlertEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'delivery_status', type: 'enum', enum: AlertDeliveryStatus })
  deliveryStatus: AlertDeliveryStatus;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ name: 'fired_at' })
  firedAt: Date;
}
