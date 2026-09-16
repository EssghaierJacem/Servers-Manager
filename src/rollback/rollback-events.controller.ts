import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RollbackService } from './rollback.service';
import { RollbackEventResponseDto } from './dto/rollback-event-response.dto';
import { toRollbackEventResponseDto } from './rollback.mapper';

@ApiTags('rollback-events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rollback-events')
export class RollbackEventsController {
  constructor(private readonly rollbackService: RollbackService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List recent rollback events across all services (audit view)' })
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<RollbackEventResponseDto[]> {
    const events = await this.rollbackService.listForOrg(user.orgId);
    return events.map(toRollbackEventResponseDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Poll a rollback event for its status and step-by-step log' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<RollbackEventResponseDto> {
    const event = await this.rollbackService.findOneForOrgOrThrow(user.orgId, id);
    return toRollbackEventResponseDto(event);
  }
}
