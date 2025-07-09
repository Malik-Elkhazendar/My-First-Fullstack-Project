import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  frontendUrl: string;
}

export default registerAs('app', (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
})); 