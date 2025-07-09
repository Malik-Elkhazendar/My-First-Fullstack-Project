import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  issuer: string;
  audience: string;
}

export default registerAs('jwt', (): JwtConfig => ({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-in-production',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'fashion-forward-api',
  audience: process.env.JWT_AUDIENCE || 'fashion-forward-client',
})); 