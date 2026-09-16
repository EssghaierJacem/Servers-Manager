import { ApiProperty } from '@nestjs/swagger';
import { DomainDnsStatus } from '../entities/domain.entity';
import { SslCertificateStatus } from '../entities/ssl-certificate.entity';

export class DomainResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  hostname: string;

  @ApiProperty({ nullable: true })
  host_id: string | null;

  @ApiProperty({ nullable: true })
  registrar: string | null;

  @ApiProperty({ nullable: true })
  domain_expires_at: Date | null;

  @ApiProperty({ enum: DomainDnsStatus })
  dns_status: DomainDnsStatus;

  @ApiProperty({ nullable: true })
  resolved_ip: string | null;

  @ApiProperty({ enum: SslCertificateStatus })
  ssl_status: SslCertificateStatus;

  @ApiProperty({ nullable: true })
  last_checked_at: Date | null;

  @ApiProperty()
  created_at: Date;
}
