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
import { InsightsService } from '../insights/insights.service';
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
    private readonly insightsService: InsightsService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Aggregate host, domain/SSL, service, and insights counts for the organization',
  })
  async getOverview(@CurrentUser() user: AuthenticatedUser): Promise<OverviewResponseDto> {
    const [hostCounts, domainCounts, serviceCounts, insights] = await Promise.all([
      this.hostsService.getOverview(user.orgId),
      this.domainsService.getOverview(user.orgId),
      this.servicesService.getOverview(user.orgId),
      this.insightsService.getInsightsForOrg(user.orgId),
    ]);

    return {
      ...hostCounts,
      ...domainCounts,
      ...serviceCounts,
      idle_hosts_count: insights.idleHosts.length,
      orphaned_domains_count: insights.orphanedDomains.length,
      orphaned_hosts_count: insights.orphanedHosts.length,
    };
  }
}
