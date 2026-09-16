import { ApiProperty } from '@nestjs/swagger';

export class DeploymentSnapshotResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  image_tag: string;

  @ApiProperty()
  deployed_at: Date;

  @ApiProperty({ nullable: true, description: 'User id, or null for an automatic capture' })
  deployed_by: string | null;

  @ApiProperty()
  is_current: boolean;

  @ApiProperty()
  created_at: Date;
}
