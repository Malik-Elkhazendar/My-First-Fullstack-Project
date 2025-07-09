import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../../logging';
import { IJwtPayload, IUser } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessTokenSecret'),
      issuer: configService.get<string>('jwt.issuer'),
      audience: configService.get<string>('jwt.audience'),
    });
  }

  async validate(payload: IJwtPayload): Promise<IUser> {
    try {
      const user = await this.authService.getUserById(payload.sub);
      
      if (!user) {
        this.logger.warn('JWT validation failed - user not found', 'JwtStrategy', {
          userId: payload.sub,
        });
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        this.logger.warn('JWT validation failed - user inactive', 'JwtStrategy', {
          userId: payload.sub,
        });
        throw new UnauthorizedException('User account is deactivated');
      }

      return user;
    } catch (error) {
      this.logger.error('JWT validation failed', error, 'JwtStrategy');
      throw error instanceof UnauthorizedException ? error : new UnauthorizedException('Invalid token');
    }
  }
} 