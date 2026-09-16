import { ApiProperty } from '@nestjs/swagger';
import { RollbackEventStatus } from '../entities/rollback-event.entity';

class RollbackLogEntryDto {
  @ApiProperty()
  timestamp: string;

  @ApiProperty()
  step: string;

  @ApiProperty({ required: false })
  command?: string;

  @ApiProperty({ required: false, nullable: true })
  exit_code?: number | null;

  @ApiProperty({ required: false })
  stdout?: string;

  @ApiProperty({ required: false })
  stderr?: string;

  @ApiProperty({ required: false })
  message?: string;
}

export class RollbackEventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  service_id: string;

  @ApiProperty()
  from_snapshot_id: string;

  @ApiProperty()
  to_snapshot_id: string;

  @ApiProperty()
  triggered_by: string;

  @ApiProperty({ enum: RollbackEventStatus })
  status: RollbackEventStatus;

  @ApiProperty({ type: [RollbackLogEntryDto] })
  log_output: RollbackLogEntryDto[];

  @ApiProperty()
  initiated_at: Date;

  @ApiProperty({ nullable: true })
  completed_at: Date | null;
}
