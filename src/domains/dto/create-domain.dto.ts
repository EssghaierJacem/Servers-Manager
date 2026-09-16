import { ApiProperty } from '@nestjs/swagger';
import { IsFQDN, IsOptional, IsUUID } from 'class-validator';

export class CreateDomainDto {
  @ApiProperty({ example: 'example.com' })
  @IsFQDN()
  hostname: string;

  @ApiProperty({ required: false, description: 'Optionally link this domain to a registered Host' })
  @IsOptional()
  @IsUUID()
  host_id?: string;
}
