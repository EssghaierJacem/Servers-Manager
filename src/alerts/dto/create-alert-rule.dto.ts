import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ALERT_CONDITIONS } from '../alert-condition';
import { AlertChannel, AlertEntityType } from '../entities/alert-rule.entity';

export class CreateAlertRuleDto {
  @ApiProperty({ example: 'Notify on host unreachable' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ enum: AlertEntityType })
  @IsIn(Object.values(AlertEntityType))
  entity_type: AlertEntityType;

  @ApiProperty({ enum: ALERT_CONDITIONS })
  @IsIn(ALERT_CONDITIONS)
  condition: (typeof ALERT_CONDITIONS)[number];

  @ApiProperty({ enum: AlertChannel })
  @IsIn(Object.values(AlertChannel))
  channel: AlertChannel;

  @ApiProperty({
    example: { webhook_url: 'https://hooks.slack.com/services/...' },
    description: 'Channel-specific config, encrypted at rest. Never returned by any response.',
  })
  @IsObject()
  channel_config: Record<string, unknown>;

  @ApiProperty({ required: false, default: 30, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  cooldown_minutes?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
