import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { InsightsService } from './insights.service';
import { InsightsResponseDto } from './dto/insights-response.dto';
import { toIdleHostDto, toOrphanedDomainDto, toOrphanedHostDto } from './insights.mapper';

@ApiTags('insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Idle hosts and orphaned domains/hosts, computed live from current DB state',
  })
  async getInsights(@CurrentUser() user: AuthenticatedUser): Promise<InsightsResponseDto> {
    const { idleHosts, orphanedDomains, orphanedHosts } =
      await this.insightsService.getInsightsForOrg(user.orgId);

    return {
      idle_hosts: idleHosts.map(toIdleHostDto),
      orphaned_domains: orphanedDomains.map(toOrphanedDomainDto),
      orphaned_hosts: orphanedHosts.map(toOrphanedHostDto),
    };
  }
}
