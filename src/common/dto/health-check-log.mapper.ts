import { HealthCheckLog } from '../../health-check-log/entities/health-check-log.entity';
import { HealthCheckLogResponseDto } from './health-check-log-response.dto';

export function toHealthCheckLogResponseDto(log: HealthCheckLog): HealthCheckLogResponseDto {
  return {
    id: log.id,
    status: log.status,
    raw_output: log.rawOutput,
    checked_at: log.checkedAt,
  };
}
