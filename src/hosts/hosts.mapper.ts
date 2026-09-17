import { Host } from './entities/host.entity';
import { HealthCheckLog } from '../health-check-log/entities/health-check-log.entity';
import { toHealthCheckLogResponseDto } from '../common/dto/health-check-log.mapper';
import { buildBootstrapCommand } from './bootstrap-command.util';
import { CreateHostResponseDto, HostResponseDto } from './dto/host-response.dto';
import { HostDetailResponseDto } from './dto/health-check-log-response.dto';
import { SetupInstructionsResponseDto } from './dto/setup-instructions-response.dto';

/**
 * Maps a Host entity to its public representation. Deliberately omits
 * ssh_key_encrypted so the private key can never leak through an API
 * response - ssh_public_key is public key material and is safe to return.
 */
export function toHostResponseDto(host: Host): HostResponseDto {
  return {
    id: host.id,
    name: host.name,
    provider: host.provider,
    ip_address: host.ipAddress,
    ssh_port: host.sshPort,
    ssh_user: host.sshUser,
    ssh_public_key: host.sshPublicKey,
    status: host.status,
    last_checked_at: host.lastCheckedAt,
    setup_verified_at: host.setupVerifiedAt,
    created_at: host.createdAt,
  };
}

export function toHostDetailResponseDto(host: Host, logs: HealthCheckLog[]): HostDetailResponseDto {
  return {
    ...toHostResponseDto(host),
    recent_logs: logs.map(toHealthCheckLogResponseDto),
  };
}

export function toCreateHostResponseDto(host: Host): CreateHostResponseDto {
  return {
    ...toHostResponseDto(host),
    bootstrap_command: buildBootstrapCommand(host.sshPublicKey),
  };
}

export function toSetupInstructionsResponseDto(host: Host): SetupInstructionsResponseDto {
  return {
    ssh_public_key: host.sshPublicKey,
    bootstrap_command: buildBootstrapCommand(host.sshPublicKey),
  };
}
