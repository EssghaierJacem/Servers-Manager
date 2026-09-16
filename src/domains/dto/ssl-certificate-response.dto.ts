import { ApiProperty } from '@nestjs/swagger';
import { SslCertificateStatus } from '../entities/ssl-certificate.entity';

export class SslCertificateResponseDto {
  @ApiProperty({ enum: SslCertificateStatus })
  status: SslCertificateStatus;

  @ApiProperty({ nullable: true })
  issuer: string | null;

  @ApiProperty({ nullable: true })
  valid_from: Date | null;

  @ApiProperty({ nullable: true })
  valid_to: Date | null;

  @ApiProperty({ nullable: true })
  last_checked_at: Date | null;
}
