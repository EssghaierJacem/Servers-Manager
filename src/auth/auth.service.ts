import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppConfig } from '../config/configuration';
import { BCRYPT_SALT_ROUNDS } from '../common/constants/auth.constant';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { User } from '../users/entities/user.entity';
import {
  AuthenticatedUser,
  JwtAccessPayload,
  JwtRefreshPayload,
} from './interfaces/authenticated-user.interface';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async register(email: string, password: string, organizationName: string): Promise<User> {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const organization = await this.organizationsService.create(organizationName);
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    return this.usersService.create({
      orgId: organization.id,
      email,
      passwordHash,
    });
  }

  async getOrganizationName(orgId: string): Promise<string> {
    const organization = await this.organizationsService.findById(orgId);
    if (!organization) {
      throw new UnauthorizedException('Organization no longer exists');
    }
    return organization.name;
  }

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  issueTokenPair(user: User, orgName: string): TokenPair {
    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      orgId: user.orgId,
      orgName,
      email: user.email,
      role: user.role,
    };
    const refreshPayload: JwtRefreshPayload = { sub: user.id };

    const jwtConfig = this.configService.get('jwt', { infer: true });

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: jwtConfig.accessSecret,
      expiresIn: jwtConfig.accessExpiresIn,
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: jwtConfig.refreshSecret,
      expiresIn: jwtConfig.refreshExpiresIn,
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string }> {
    const jwtConfig = this.configService.get('jwt', { infer: true });

    let payload: JwtRefreshPayload;
    try {
      payload = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
        secret: jwtConfig.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const orgName = await this.getOrganizationName(user.orgId);
    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      orgId: user.orgId,
      orgName,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: jwtConfig.accessSecret,
      expiresIn: jwtConfig.accessExpiresIn,
    });

    return { access_token: accessToken };
  }

  toAuthenticatedUser(user: User, orgName: string): AuthenticatedUser {
    return { id: user.id, orgId: user.orgId, orgName, email: user.email, role: user.role };
  }
}
