import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig, DatabaseConfig, CorsConfig } from './index';

/**
 * Configuration Service
 * 
 * Provides a clean abstraction layer for accessing configuration values.
 * Follows SOLID principles:
 * - Single Responsibility: Only handles configuration access
 * - Open/Closed: Easy to extend with new configuration types
 * - Dependency Inversion: Depends on ConfigService abstraction
 */
@Injectable()
export class ConfigurationService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get application configuration
   */
  get app(): AppConfig {
    const config = this.configService.get<AppConfig>('app');
    if (!config) {
      throw new Error('Application configuration not found');
    }
    return config;
  }

  /**
   * Get database configuration
   */
  get database(): DatabaseConfig {
    const config = this.configService.get<DatabaseConfig>('database');
    if (!config) {
      throw new Error('Database configuration not found');
    }
    return config;
  }

  /**
   * Get CORS configuration
   */
  get cors(): CorsConfig {
    const config = this.configService.get<CorsConfig>('cors');
    if (!config) {
      throw new Error('CORS configuration not found');
    }
    return config;
  }

  /**
   * Check if running in development mode
   */
  get isDevelopment(): boolean {
    return this.app.nodeEnv === 'development';
  }

  /**
   * Check if running in production mode
   */
  get isProduction(): boolean {
    return this.app.nodeEnv === 'production';
  }

  /**
   * Get a specific configuration value with type safety
   */
  get<T>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined) {
      throw new Error(`Configuration key '${key}' not found`);
    }
    return value;
  }

  /**
   * Get a configuration value with default fallback
   */
  getOrDefault<T>(key: string, defaultValue: T): T {
    return this.configService.get<T>(key) ?? defaultValue;
  }
} 