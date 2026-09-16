import { ApiProperty } from '@nestjs/swagger';
import { HealthCheckLogResponseDto } from '../../common/dto/health-check-log-response.dto';

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
