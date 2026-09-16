import { ApiProperty } from '@nestjs/swagger';
import { ServiceStatus } from '../entities/service.entity';

export class ServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  host_id: string;

  @ApiProperty()
  container_id: string;

  @ApiProperty()
  container_name: string;

  @ApiProperty()
  image: string;

  @ApiProperty({ nullable: true })
  current_tag: string | null;

  @ApiProperty({ enum: ServiceStatus })
  status: ServiceStatus;

  @ApiProperty({ type: Object, nullable: true })
  port_mappings: Record<string, unknown> | null;

  @ApiProperty()
  last_checked_at: Date;

  @ApiProperty()
  created_at: Date;
}
