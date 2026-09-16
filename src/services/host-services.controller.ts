import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/constants/roles.constant';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ServicesService } from './services.service';
import { ServiceResponseDto } from './dto/service-response.dto';
import { toServiceResponseDto } from './services.mapper';

@ApiTags('hosts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hosts')
export class HostServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get(':id/services')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List the containers discovered on a host by the last docker ps sync' })
  async findAllForHost(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') hostId: string,
  ): Promise<ServiceResponseDto[]> {
    const services = await this.servicesService.findAllForHost(user.orgId, hostId);
    return services.map(toServiceResponseDto);
  }
}
