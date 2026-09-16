import { ApiProperty } from '@nestjs/swagger';

export class CheckTriggeredResponseDto {
  @ApiProperty()
  job_id: string;
}
