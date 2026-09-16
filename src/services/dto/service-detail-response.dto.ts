import { ApiProperty } from '@nestjs/swagger';
import { HealthCheckLogResponseDto } from '../../common/dto/health-check-log-response.dto';
import { ServiceResponseDto } from './service-response.dto';

export class ServiceDetailResponseDto extends ServiceResponseDto {
  @ApiProperty({ type: [HealthCheckLogResponseDto] })
  recent_logs: HealthCheckLogResponseDto[];
}
