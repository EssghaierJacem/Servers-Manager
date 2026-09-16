import { ApiProperty } from '@nestjs/swagger';

export class OverviewResponseDto {
  @ApiProperty()
  total_hosts: number;

  @ApiProperty()
  healthy: number;

  @ApiProperty()
  degraded: number;

  @ApiProperty()
  unreachable: number;

  @ApiProperty()
  unknown: number;
}
