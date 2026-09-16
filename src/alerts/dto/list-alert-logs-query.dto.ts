import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { AlertEntityType } from '../entities/alert-rule.entity';

export class ListAlertLogsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  alert_rule_id?: string;

  @ApiPropertyOptional({ enum: AlertEntityType })
  @IsOptional()
  @IsIn(Object.values(AlertEntityType))
  entity_type?: AlertEntityType;
}
