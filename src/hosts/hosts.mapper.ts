import { Host } from './entities/host.entity';
import { HealthCheckLog } from './entities/health-check-log.entity';
import { HostResponseDto } from './dto/host-response.dto';
import {
  HealthCheckLogResponseDto,
  HostDetailResponseDto,
} from './dto/health-check-log-response.dto';

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

function toHealthCheckLogResponseDto(log: HealthCheckLog): HealthCheckLogResponseDto {
  return {
    id: log.id,
    status: log.status,
    raw_output: log.rawOutput,
    checked_at: log.checkedAt,
  };
}

export function toHostDetailResponseDto(host: Host, logs: HealthCheckLog[]): HostDetailResponseDto {
  return {
    ...toHostResponseDto(host),
    recent_logs: logs.map(toHealthCheckLogResponseDto),
  };
}
