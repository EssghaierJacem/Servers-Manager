import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Outcome label; vocabulary depends on which check wrote it' })
  status: string;

  @ApiProperty({ type: Object })
  raw_output: Record<string, unknown>;

  @ApiProperty()
  checked_at: Date;
}
