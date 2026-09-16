import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RollbackService } from './rollback.service';
import { CreateRollbackDto } from './dto/create-rollback.dto';
import { RollbackTriggeredResponseDto } from './dto/rollback-triggered-response.dto';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServiceRollbackController {
  constructor(private readonly rollbackService: RollbackService) {}

  @Post(':id/rollback')
  // Rollback changes what's actually running on a host - restricted to the
  // admin role via the same RolesGuard used everywhere else, even though
  // admin is still the only role that exists.
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Roll a service back to a previous deployment snapshot (async)' })
  async rollback(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') serviceId: string,
    @Body() dto: CreateRollbackDto,
  ): Promise<RollbackTriggeredResponseDto> {
    const event = await this.rollbackService.enqueueRollback(
      user.orgId,
      serviceId,
      dto.target_snapshot_id,
      user.id,
    );
    return { rollback_event_id: event.id };
  }
}
