import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { HostsService } from './hosts.service';
import { OverviewResponseDto } from './dto/overview-response.dto';

@ApiTags('overview')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('overview')
export class OverviewController {
  constructor(private readonly hostsService: HostsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Aggregate host status counts for the organization' })
  async getOverview(@CurrentUser() user: AuthenticatedUser): Promise<OverviewResponseDto> {
    return this.hostsService.getOverview(user.orgId);
  }
}
