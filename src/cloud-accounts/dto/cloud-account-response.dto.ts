import { ApiProperty } from '@nestjs/swagger';
import { CloudProvider } from '../entities/cloud-account.entity';

export class CloudAccountResponseDto {
  @ApiProperty({ nullable: true })
  id: string | null;

  @ApiProperty({ enum: CloudProvider })
  provider: CloudProvider;

  @ApiProperty()
  provider_label: string;

  @ApiProperty()
  connected: boolean;

  @ApiProperty({ nullable: true })
  label: string | null;

  @ApiProperty({ nullable: true })
  connected_at: Date | null;

  @ApiProperty({
    description: 'Always null today - billing/usage sync per provider is a future phase.',
    nullable: true,
  })
  monthly_cost_usd: number | null;
}
