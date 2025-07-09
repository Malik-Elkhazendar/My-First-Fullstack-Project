import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../logging';
import { ITokenService, IJwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class TokenService implements ITokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.accessTokenSecret = this.configService.get<string>('jwt.accessTokenSecret', 'fallback-access-secret');
    this.refreshTokenSecret = this.configService.get<string>('jwt.refreshTokenSecret', 'fallback-refresh-secret');
    this.accessTokenExpiry = this.configService.get<string>('jwt.accessTokenExpiry', '15m');
    this.refreshTokenExpiry = this.configService.get<string>('jwt.refreshTokenExpiry', '7d');
  }

  /**
   * Generate access token for authentication
   */
  generateAccessToken(payload: IJwtPayload): string {
    try {
      return this.jwtService.sign(payload, {
        secret: this.accessTokenSecret,
        expiresIn: this.accessTokenExpiry,
      });
    } catch (error) {
      this.logger.error('Access token generation failed', error, 'TokenService');
      throw new Error('Access token generation failed');
    }
  }

  /**
   * Generate refresh token for token renewal
   */
  generateRefreshToken(payload: IJwtPayload): string {
    try {
      return this.jwtService.sign(payload, {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenExpiry,
      });
    } catch (error) {
      this.logger.error('Refresh token generation failed', error, 'TokenService');
      throw new Error('Refresh token generation failed');
    }
  }

  /**
   * Verify and decode a JWT token
   */
  async verifyToken(token: string, isRefreshToken: boolean = false): Promise<IJwtPayload> {
    try {
      const secret = isRefreshToken ? this.refreshTokenSecret : this.accessTokenSecret;
      return this.jwtService.verify(token, { secret }) as IJwtPayload;
    } catch (error) {
      this.logger.warn('Token verification failed', 'TokenService', { error: error.message });
      throw error;
    }
  }

  /**
   * Decode token without verification (for debugging/logging)
   */
  decodeToken(token: string): IJwtPayload | null {
    try {
      return this.jwtService.decode(token) as IJwtPayload;
    } catch (error) {
      this.logger.warn('Token decode failed', 'TokenService', { error: error.message });
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload?.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Extract user ID from token
   */
  extractUserIdFromToken(token: string): string | null {
    try {
      const payload = this.decodeToken(token);
      return payload?.sub || null;
    } catch (error) {
      return null;
    }
  }
} 