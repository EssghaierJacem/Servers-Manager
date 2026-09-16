import { ApiProperty } from '@nestjs/swagger';

export class RollbackTriggeredResponseDto {
  @ApiProperty()
  rollback_event_id: string;
}
