import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsIP,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { HostProvider, DEFAULT_SSH_PORT } from '../entities/host.entity';

export class CreateHostDto {
  @ApiProperty({ example: 'prod-web-01' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: HostProvider, example: HostProvider.AZURE })
  @IsEnum(HostProvider)
  provider: HostProvider;

  @ApiProperty({ example: '203.0.113.10' })
  @IsIP()
  ip_address: string;

  @ApiProperty({ example: DEFAULT_SSH_PORT, required: false, default: DEFAULT_SSH_PORT })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  ssh_port?: number;

  @ApiProperty({ example: 'ubuntu' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  ssh_user: string;

  @ApiProperty({ description: 'PEM-encoded SSH private key, never returned by the API' })
  @IsString()
  @MinLength(1)
  ssh_private_key: string;
}
