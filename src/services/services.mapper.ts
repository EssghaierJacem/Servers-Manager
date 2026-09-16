import { HealthCheckLog } from '../health-check-log/entities/health-check-log.entity';
import { toHealthCheckLogResponseDto } from '../common/dto/health-check-log.mapper';
import { Service } from './entities/service.entity';
import { ServiceResponseDto } from './dto/service-response.dto';
import { ServiceDetailResponseDto } from './dto/service-detail-response.dto';

export function toServiceResponseDto(service: Service): ServiceResponseDto {
  return {
    id: service.id,
    host_id: service.hostId,
    container_id: service.containerId,
    container_name: service.containerName,
    image: service.image,
    current_tag: service.currentTag,
    status: service.status,
    port_mappings: service.portMappings,
    last_checked_at: service.lastCheckedAt,
    created_at: service.createdAt,
  };
}

export function toServiceDetailResponseDto(
  service: Service,
  logs: HealthCheckLog[],
): ServiceDetailResponseDto {
  return {
    ...toServiceResponseDto(service),
    recent_logs: logs.map(toHealthCheckLogResponseDto),
  };
}
