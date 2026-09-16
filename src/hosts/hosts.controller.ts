import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { HostsService } from './hosts.service';
import { CreateHostDto } from './dto/create-host.dto';
import { HostResponseDto } from './dto/host-response.dto';
import { HostDetailResponseDto } from './dto/health-check-log-response.dto';
import { CheckTriggeredResponseDto } from '../common/dto/check-triggered-response.dto';
import { toHostDetailResponseDto, toHostResponseDto } from './hosts.mapper';

@ApiTags('hosts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hosts')
export class HostsController {
  constructor(private readonly hostsService: HostsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a new host and encrypt its SSH key at rest' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHostDto,
  ): Promise<HostResponseDto> {
    const host = await this.hostsService.create(user.orgId, dto);
    return toHostResponseDto(host);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all hosts with their current status' })
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<HostResponseDto[]> {
    const hosts = await this.hostsService.findAllForOrg(user.orgId);
    return hosts.map(toHostResponseDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a host and its 20 most recent health check logs' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<HostDetailResponseDto> {
    const host = await this.hostsService.findOneForOrgOrThrow(user.orgId, id);
    const logs = await this.hostsService.getRecentLogs(host.id);
    return toHostDetailResponseDto(host, logs);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a host' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.hostsService.remove(user.orgId, id);
  }

  @Post(':id/check')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Enqueue an immediate health check for a host' })
  async triggerCheck(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<CheckTriggeredResponseDto> {
    const jobId = await this.hostsService.enqueueCheck(user.orgId, id);
    return { job_id: jobId };
  }
}
