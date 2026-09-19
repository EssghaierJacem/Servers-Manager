import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { CloudProvider } from '../entities/cloud-account.entity';

export class ConnectCloudAccountDto {
  @ApiProperty({ enum: CloudProvider })
  @IsEnum(CloudProvider)
  provider: CloudProvider;

  @ApiProperty({ example: 'Production AWS account' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label: string;

  @ApiProperty({ description: "The provider's API token, encrypted at rest" })
  @IsString()
  @MinLength(1)
  apiKey: string;
}
