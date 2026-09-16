import { ApiProperty } from '@nestjs/swagger';
import { HealthCheckStatus } from '../entities/health-check-log.entity';

export class HealthCheckLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: HealthCheckStatus })
  status: HealthCheckStatus;

  @ApiProperty({ type: Object })
  raw_output: Record<string, unknown>;

  @ApiProperty()
  checked_at: Date;
}

export class HostDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  ip_address: string;

  @ApiProperty()
  ssh_port: number;

  @ApiProperty()
  ssh_user: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ nullable: true })
  last_checked_at: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ type: [HealthCheckLogResponseDto] })
  recent_logs: HealthCheckLogResponseDto[];
}
