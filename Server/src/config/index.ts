// Configuration exports
export { default as appConfig } from './app.config';
export { default as databaseConfig } from './database.config';
export { default as corsConfig } from './cors.config';
export { default as loggerConfig } from './logger.config';
export { default as jwtConfig } from './jwt.config';

// Service exports
export { ConfigurationService } from './configuration.service';

// Type exports
export type { AppConfig } from './app.config';
export type { DatabaseConfig } from './database.config';
export type { CorsConfig } from './cors.config';
export type { LoggerConfig } from '../logging/interfaces/logger.interface';
export type { JwtConfig } from './jwt.config';

// Combined configurations array
import appConfig from './app.config';
import databaseConfig from './database.config';
import corsConfig from './cors.config';
import loggerConfig from './logger.config';
import jwtConfig from './jwt.config';

export const configurations = [
  appConfig,
  databaseConfig,
  corsConfig,
  loggerConfig,
  jwtConfig,
]; 