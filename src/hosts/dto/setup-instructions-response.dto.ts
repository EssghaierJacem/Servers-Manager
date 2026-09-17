import { ApiProperty } from '@nestjs/swagger';

export class SetupInstructionsResponseDto {
  @ApiProperty()
  ssh_public_key: string;

  @ApiProperty()
  bootstrap_command: string;
}
