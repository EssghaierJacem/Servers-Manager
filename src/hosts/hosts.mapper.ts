import { Host } from './entities/host.entity';
import { HealthCheckLog } from '../health-check-log/entities/health-check-log.entity';
import { toHealthCheckLogResponseDto } from '../common/dto/health-check-log.mapper';
import { HostResponseDto } from './dto/host-response.dto';
import { HostDetailResponseDto } from './dto/health-check-log-response.dto';

/**
 * Maps a Host entity to its public representation. Deliberately omits
 * ssh_key_encrypted so key material can never leak through an API response.
 */
export function toHostResponseDto(host: Host): HostResponseDto {
  return {
    id: host.id,
    name: host.name,
    provider: host.provider,
    ip_address: host.ipAddress,
    ssh_port: host.sshPort,
    ssh_user: host.sshUser,
    status: host.status,
    last_checked_at: host.lastCheckedAt,
    created_at: host.createdAt,
  };
}

export function toHostDetailResponseDto(host: Host, logs: HealthCheckLog[]): HostDetailResponseDto {
  return {
    ...toHostResponseDto(host),
    recent_logs: logs.map(toHealthCheckLogResponseDto),
  };
}
