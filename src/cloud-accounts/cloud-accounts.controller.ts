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
import { CloudAccountsService } from './cloud-accounts.service';
import { ConnectCloudAccountDto } from './dto/connect-cloud-account.dto';
import { CloudAccountResponseDto } from './dto/cloud-account-response.dto';

@ApiTags('cloud-accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cloud-accounts')
export class CloudAccountsController {
  constructor(private readonly cloudAccountsService: CloudAccountsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List every supported cloud provider and its connection state' })
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<CloudAccountResponseDto[]> {
    return this.cloudAccountsService.findAllForOrg(user.orgId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Connect (or reconnect) a cloud provider with an API key' })
  async connect(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConnectCloudAccountDto,
  ): Promise<CloudAccountResponseDto> {
    return this.cloudAccountsService.connect(user.orgId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect a cloud provider' })
  async disconnect(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.cloudAccountsService.disconnect(user.orgId, id);
  }
}
