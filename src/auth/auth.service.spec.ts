import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { UserRole } from '../common/constants/roles.constant';
import { User } from '../users/entities/user.entity';
import { AppConfig } from '../config/configuration';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let organizationsService: jest.Mocked<OrganizationsService>;
  let jwtService: JwtService;

  const org = { id: 'org-1', name: 'Default Organization', createdAt: new Date() };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    organizationsService = {
      getOrCreateDefault: jest.fn().mockResolvedValue(org),
    } as unknown as jest.Mocked<OrganizationsService>;

    jwtService = new JwtService({});

    const configService = {
      get: (key: string) => {
        if (key === 'jwt') {
          return {
            accessSecret: 'access-secret-for-tests',
            accessExpiresIn: '15m',
            refreshSecret: 'refresh-secret-for-tests',
            refreshExpiresIn: '7d',
          };
        }
        return undefined;
      },
    } as unknown as ConfigService<AppConfig, true>;

    authService = new AuthService(usersService, organizationsService, jwtService, configService);
  });

  describe('register', () => {
    it('hashes the password and creates the user under the default org', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation(
        async (input) =>
          ({
            id: 'user-1',
            orgId: input.orgId,
            email: input.email,
            passwordHash: input.passwordHash,
            role: UserRole.ADMIN,
            createdAt: new Date(),
          }) as User,
      );

      const user = await authService.register('new@example.com', 'a-strong-password');

      expect(user.orgId).toBe(org.id);
      expect(user.passwordHash).not.toBe('a-strong-password');
      expect(await bcrypt.compare('a-strong-password', user.passwordHash)).toBe(true);
    });

    it('throws a conflict when the email is already registered', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'existing' } as User);

      await expect(authService.register('taken@example.com', 'password123')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateCredentials', () => {
    it('returns the user when the password matches', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      const storedUser = { id: 'user-1', email: 'a@b.com', passwordHash } as User;
      usersService.findByEmail.mockResolvedValue(storedUser);

      const result = await authService.validateCredentials('a@b.com', 'correct-password');

      expect(result).toBe(storedUser);
    });

    it('rejects when the password does not match', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      usersService.findByEmail.mockResolvedValue({ id: 'user-1', passwordHash } as User);

      await expect(authService.validateCredentials('a@b.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.validateCredentials('nobody@b.com', 'whatever')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('issueTokenPair', () => {
    it('issues an access and refresh token that both verify', () => {
      const user = {
        id: 'user-1',
        orgId: 'org-1',
        email: 'a@b.com',
        role: UserRole.ADMIN,
      } as User;

      const tokens = authService.issueTokenPair(user);

      expect(
        jwtService.verify(tokens.access_token, { secret: 'access-secret-for-tests' }),
      ).toMatchObject({ sub: 'user-1', orgId: 'org-1' });
      expect(
        jwtService.verify(tokens.refresh_token, { secret: 'refresh-secret-for-tests' }),
      ).toMatchObject({ sub: 'user-1' });
    });
  });
});
