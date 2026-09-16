import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateRollbackDto {
  @ApiProperty({ description: 'The DeploymentSnapshot id to roll back to' })
  @IsUUID()
  target_snapshot_id: string;
}
