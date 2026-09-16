import { ApiProperty } from '@nestjs/swagger';
import { AlertChannel, AlertEntityType } from '../entities/alert-rule.entity';

export class AlertRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: AlertEntityType })
  entity_type: AlertEntityType;

  @ApiProperty()
  condition: string;

  @ApiProperty({ enum: AlertChannel })
  channel: AlertChannel;

  @ApiProperty()
  cooldown_minutes: number;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  created_at: Date;
}
