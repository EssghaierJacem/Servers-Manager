import { Domain } from './entities/domain.entity';
import { SSLCertificate, SslCertificateStatus } from './entities/ssl-certificate.entity';
import { HealthCheckLog } from '../health-check-log/entities/health-check-log.entity';
import { toHealthCheckLogResponseDto } from '../common/dto/health-check-log.mapper';
import { DomainResponseDto } from './dto/domain-response.dto';
import { DomainDetailResponseDto } from './dto/domain-detail-response.dto';
import { SslCertificateResponseDto } from './dto/ssl-certificate-response.dto';

export function toSslCertificateResponseDto(cert: SSLCertificate): SslCertificateResponseDto {
  return {
    status: cert.status,
    issuer: cert.issuer,
    valid_from: cert.validFrom,
    valid_to: cert.validTo,
    last_checked_at: cert.lastCheckedAt,
  };
}

export function toDomainResponseDto(
  domain: Domain,
  sslStatus: SslCertificateStatus,
): DomainResponseDto {
  return {
    id: domain.id,
    hostname: domain.hostname,
    host_id: domain.hostId,
    registrar: domain.registrar,
    domain_expires_at: domain.domainExpiresAt,
    dns_status: domain.dnsStatus,
    resolved_ip: domain.resolvedIp,
    ssl_status: sslStatus,
    last_checked_at: domain.lastCheckedAt,
    created_at: domain.createdAt,
  };
}

export function toDomainDetailResponseDto(
  domain: Domain,
  sslCertificate: SSLCertificate,
  logs: HealthCheckLog[],
): DomainDetailResponseDto {
  return {
    id: domain.id,
    hostname: domain.hostname,
    host_id: domain.hostId,
    registrar: domain.registrar,
    domain_expires_at: domain.domainExpiresAt,
    dns_status: domain.dnsStatus,
    resolved_ip: domain.resolvedIp,
    last_checked_at: domain.lastCheckedAt,
    created_at: domain.createdAt,
    ssl_certificate: toSslCertificateResponseDto(sslCertificate),
    recent_logs: logs.map(toHealthCheckLogResponseDto),
  };
}
