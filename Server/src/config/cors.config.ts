import { registerAs } from '@nestjs/config';

export interface CorsConfig {
  origin: string;
  methods: string;
  credentials: boolean;
}

export default registerAs('cors', (): CorsConfig => ({
  origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:4200',
  methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: process.env.CORS_CREDENTIALS === 'true' || true,
})); 