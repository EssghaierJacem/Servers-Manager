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

  @ApiProperty()
  domains_total: number;

  @ApiProperty()
  ssl_valid: number;

  @ApiProperty()
  ssl_expiring_soon: number;

  @ApiProperty()
  ssl_expired: number;

  @ApiProperty()
  ssl_invalid: number;

  @ApiProperty()
  domains_not_resolving: number;

  @ApiProperty()
  services_total: number;

  @ApiProperty()
  running: number;

  @ApiProperty()
  unhealthy: number;

  @ApiProperty()
  stopped: number;

  @ApiProperty()
  crash_loop: number;

  @ApiProperty({
    description:
      'Services with unknown status (container missing from the last sync, or unparseable docker ps status)',
  })
  services_unknown: number;
}
