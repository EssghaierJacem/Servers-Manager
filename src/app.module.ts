import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration, { AppConfig } from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { CryptoModule } from './crypto/crypto.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HostsModule } from './hosts/hosts.module';
import { HealthCheckModule } from './health-check/health-check.module';
import { Organization } from './organizations/entities/organization.entity';
import { User } from './users/entities/user.entity';
import { Host } from './hosts/entities/host.entity';
import { HealthCheckLog } from './hosts/entities/health-check-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        type: 'postgres',
        url: configService.get('databaseUrl', { infer: true }),
        entities: [Organization, User, Host, HealthCheckLog],
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        connection: {
          host: configService.get('redis', { infer: true }).host,
          port: configService.get('redis', { infer: true }).port,
        },
      }),
    }),
    CryptoModule,
    OrganizationsModule,
    UsersModule,
    AuthModule,
    HostsModule,
    HealthCheckModule,
  ],
})
export class AppModule {}
