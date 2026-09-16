import { ApiProperty } from '@nestjs/swagger';
import { HostProvider, HostStatus } from '../entities/host.entity';

export class HostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: HostProvider })
  provider: HostProvider;

  @ApiProperty()
  ip_address: string;

  @ApiProperty()
  ssh_port: number;

  @ApiProperty()
  ssh_user: string;

  @ApiProperty({ enum: HostStatus })
  status: HostStatus;

  @ApiProperty({ nullable: true })
  last_checked_at: Date | null;

  @ApiProperty()
  created_at: Date;
}
