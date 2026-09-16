import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { HostsService } from '../hosts/hosts.service';
import { DomainsService } from '../domains/domains.service';
import { ServicesService } from '../services/services.service';
import { OverviewResponseDto } from './dto/overview-response.dto';

@ApiTags('overview')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('overview')
export class OverviewController {
  constructor(
    private readonly hostsService: HostsService,
    private readonly domainsService: DomainsService,
    private readonly servicesService: ServicesService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Aggregate host, domain/SSL, and service status counts for the organization',
  })
  async getOverview(@CurrentUser() user: AuthenticatedUser): Promise<OverviewResponseDto> {
    const [hostCounts, domainCounts, serviceCounts] = await Promise.all([
      this.hostsService.getOverview(user.orgId),
      this.domainsService.getOverview(user.orgId),
      this.servicesService.getOverview(user.orgId),
    ]);

    return { ...hostCounts, ...domainCounts, ...serviceCounts };
  }
}
