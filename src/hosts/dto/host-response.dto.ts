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

  @ApiProperty({ description: 'Public key material only - safe to display, copy, and re-fetch' })
  ssh_public_key: string;

  @ApiProperty({ enum: HostStatus })
  status: HostStatus;

  @ApiProperty({ nullable: true })
  last_checked_at: Date | null;

  @ApiProperty({ nullable: true, description: 'Set on the first successful check after creation' })
  setup_verified_at: Date | null;

  @ApiProperty()
  created_at: Date;
}

export class CreateHostResponseDto extends HostResponseDto {
  @ApiProperty({
    description: 'One-line command to run once on the target machine to install the public key',
  })
  bootstrap_command: string;
}
