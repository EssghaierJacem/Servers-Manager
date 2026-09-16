import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AlertsService } from './alerts.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';
import { AlertRuleResponseDto } from './dto/alert-rule-response.dto';
import { toAlertRuleResponseDto } from './alerts.mapper';

@ApiTags('alert-rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alert-rules')
export class AlertRulesController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create an alert rule' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAlertRuleDto,
  ): Promise<AlertRuleResponseDto> {
    const rule = await this.alertsService.create(user.orgId, dto);
    return toAlertRuleResponseDto(rule);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List alert rules' })
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<AlertRuleResponseDto[]> {
    const rules = await this.alertsService.findAllForOrg(user.orgId);
    return rules.map(toAlertRuleResponseDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get an alert rule' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<AlertRuleResponseDto> {
    const rule = await this.alertsService.findOneForOrgOrThrow(user.orgId, id);
    return toAlertRuleResponseDto(rule);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an alert rule (e.g. toggle enabled, change cooldown)' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAlertRuleDto,
  ): Promise<AlertRuleResponseDto> {
    const rule = await this.alertsService.update(user.orgId, id, dto);
    return toAlertRuleResponseDto(rule);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an alert rule' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.alertsService.remove(user.orgId, id);
  }
}
