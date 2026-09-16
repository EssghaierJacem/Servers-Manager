import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { DeploymentSnapshotsService } from '../deployment-snapshots/deployment-snapshots.service';
import { DeploymentSnapshotResponseDto } from '../deployment-snapshots/dto/deployment-snapshot-response.dto';
import { toDeploymentSnapshotResponseDto } from '../deployment-snapshots/deployment-snapshots.mapper';
import { ServicesService } from './services.service';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServiceSnapshotsController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly deploymentSnapshotsService: DeploymentSnapshotsService,
  ) {}

  @Get(':id/snapshots')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deployment snapshot history for a service, newest first' })
  async findHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') serviceId: string,
  ): Promise<DeploymentSnapshotResponseDto[]> {
    const service = await this.servicesService.findOneForOrgOrThrow(user.orgId, serviceId);
    const snapshots = await this.deploymentSnapshotsService.findHistoryForService(service.id);
    return snapshots.map(toDeploymentSnapshotResponseDto);
  }
}
