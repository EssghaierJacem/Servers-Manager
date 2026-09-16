import { Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CheckTriggeredResponseDto } from '../common/dto/check-triggered-response.dto';
import { ServicesService } from './services.service';
import { ServiceDetailResponseDto } from './dto/service-detail-response.dto';
import { toServiceDetailResponseDto } from './services.mapper';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a service and its 20 most recent health check logs' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ServiceDetailResponseDto> {
    const service = await this.servicesService.findOneForOrgOrThrow(user.orgId, id);
    const logs = await this.servicesService.getRecentLogs(service.id);
    return toServiceDetailResponseDto(service, logs);
  }

  @Post(':id/check')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      "Trigger a fresh docker ps sync for this service's host (not a per-container SSH call)",
  })
  async triggerCheck(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<CheckTriggeredResponseDto> {
    const jobId = await this.servicesService.enqueueCheck(user.orgId, id);
    return { job_id: jobId };
  }
}
