import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../../logging';
import { IUser } from '../interfaces/auth.interface';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  /**
   * Validate user credentials for local strategy
   */
  async validate(email: string, password: string): Promise<IUser> {
    try {
      const user = await this.authService.validateUser(email, password);
      
      if (!user) {
        this.logger.warn('Local validation failed', 'LocalStrategy', { email });
        throw new UnauthorizedException('Invalid credentials');
      }

      return user;
    } catch (error) {
      this.logger.error('Local validation failed', error, 'LocalStrategy');
      throw error instanceof UnauthorizedException ? error : new UnauthorizedException('Authentication failed');
    }
  }
} 