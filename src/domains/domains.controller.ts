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
import { CheckTriggeredResponseDto } from '../common/dto/check-triggered-response.dto';
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { DomainResponseDto } from './dto/domain-response.dto';
import { DomainDetailResponseDto } from './dto/domain-detail-response.dto';
import { toDomainDetailResponseDto, toDomainResponseDto } from './domains.mapper';

@ApiTags('domains')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a domain and trigger its initial DNS/WHOIS/TLS check' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDomainDto,
  ): Promise<DomainResponseDto> {
    const { domain } = await this.domainsService.create(user.orgId, dto);
    const sslCertificate = await this.domainsService.getSslCertificateOrThrow(domain.id);
    return toDomainResponseDto(domain, sslCertificate.status);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all domains with DNS/SSL status' })
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<DomainResponseDto[]> {
    const rows = await this.domainsService.findAllForOrg(user.orgId);
    return rows.map(({ domain, sslStatus }) => toDomainResponseDto(domain, sslStatus));
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get a domain, its current SSL certificate, and its 20 most recent logs',
  })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DomainDetailResponseDto> {
    const domain = await this.domainsService.findOneForOrgOrThrow(user.orgId, id);
    const [sslCertificate, logs] = await Promise.all([
      this.domainsService.getSslCertificateOrThrow(domain.id),
      this.domainsService.getRecentLogs(domain.id),
    ]);
    return toDomainDetailResponseDto(domain, sslCertificate, logs);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a domain' })
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    await this.domainsService.remove(user.orgId, id);
  }

  @Post(':id/check')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Enqueue an immediate DNS + WHOIS + TLS check (max once/minute)' })
  async triggerCheck(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<CheckTriggeredResponseDto> {
    const jobId = await this.domainsService.enqueueCheck(user.orgId, id);
    return { job_id: jobId };
  }
}
