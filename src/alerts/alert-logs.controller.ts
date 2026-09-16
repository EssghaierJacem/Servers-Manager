import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AlertsService } from './alerts.service';
import { ListAlertLogsQueryDto } from './dto/list-alert-logs-query.dto';
import { AlertLogResponseDto } from './dto/alert-log-response.dto';
import { toAlertLogResponseDto } from './alerts.mapper';

@ApiTags('alert-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alert-logs')
export class AlertLogsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Alert delivery audit trail, filterable by alert_rule_id and entity_type',
  })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAlertLogsQueryDto,
  ): Promise<AlertLogResponseDto[]> {
    const logs = await this.alertsService.findLogsForOrg(user.orgId, query);
    return logs.map(toAlertLogResponseDto);
  }
}
