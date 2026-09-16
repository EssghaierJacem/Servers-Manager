import { ApiProperty } from '@nestjs/swagger';
import { AlertDeliveryStatus } from '../entities/alert-log.entity';
import { AlertEntityType } from '../entities/alert-rule.entity';

export class AlertLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  alert_rule_id: string;

  @ApiProperty({ enum: AlertEntityType })
  entity_type: AlertEntityType;

  @ApiProperty()
  entity_id: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: AlertDeliveryStatus })
  delivery_status: AlertDeliveryStatus;

  @ApiProperty({ nullable: true })
  error: string | null;

  @ApiProperty()
  fired_at: Date;
}
