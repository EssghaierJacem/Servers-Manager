import { Host } from '../hosts/entities/host.entity';
import { Domain } from '../domains/entities/domain.entity';
import { IdleHostDto, OrphanedDomainDto, OrphanedHostDto } from './dto/insights-response.dto';

export function toIdleHostDto(host: Host): IdleHostDto {
  return {
    id: host.id,
    name: host.name,
    ip_address: host.ipAddress,
    last_checked_at: host.lastCheckedAt,
    created_at: host.createdAt,
  };
}

export function toOrphanedDomainDto(domain: Domain): OrphanedDomainDto {
  return {
    id: domain.id,
    hostname: domain.hostname,
    host_id: domain.hostId,
    resolved_ip: domain.resolvedIp,
  };
}

export function toOrphanedHostDto(host: Host): OrphanedHostDto {
  return {
    id: host.id,
    name: host.name,
    ip_address: host.ipAddress,
  };
}
