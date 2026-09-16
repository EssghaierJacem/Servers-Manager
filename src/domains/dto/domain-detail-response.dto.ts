import { ApiProperty } from '@nestjs/swagger';
import { DomainDnsStatus } from '../entities/domain.entity';
import { HealthCheckLogResponseDto } from '../../common/dto/health-check-log-response.dto';
import { SslCertificateResponseDto } from './ssl-certificate-response.dto';

export class DomainDetailResponseDto {
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

  @ApiProperty({ nullable: true })
  last_checked_at: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ type: SslCertificateResponseDto })
  ssl_certificate: SslCertificateResponseDto;

  @ApiProperty({ type: [HealthCheckLogResponseDto] })
  recent_logs: HealthCheckLogResponseDto[];
}
