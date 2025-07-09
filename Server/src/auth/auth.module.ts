import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Schemas
import { User, UserSchema } from './schemas/user.schema';

// Services
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

// Controllers
import { AuthController } from './controllers/auth.controller';

// Logger
import { LoggerModule } from '../logging';

@Module({
  imports: [
    // MongoDB schemas
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),

    // Passport configuration
    PassportModule.register({ 
      defaultStrategy: 'jwt',
      session: false, // We're using stateless JWT tokens
    }),

    // JWT Module configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.accessTokenSecret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.accessTokenExpiry', '15m'),
          issuer: configService.get<string>('jwt.issuer'),
          audience: configService.get<string>('jwt.audience'),
        },
      }),
    }),

    // Import logger module for dependency injection
    LoggerModule,

    // Config module for JWT settings
    ConfigModule,
  ],

  providers: [
    // Core services
    AuthService,
    PasswordService,
    TokenService,

    // Passport strategies
    JwtStrategy,
    LocalStrategy,

    // Guards
    JwtAuthGuard,
    RolesGuard,
  ],

  controllers: [
    AuthController,
  ],

  exports: [
    // Export services for use in other modules
    AuthService,
    PasswordService,
    TokenService,
    
    // Export guards for use in other modules
    JwtAuthGuard,
    RolesGuard,

    // Export strategies
    JwtStrategy,
    LocalStrategy,

    // Export JWT module for other modules that might need it
    JwtModule,
  ],
})
export class AuthModule {} 