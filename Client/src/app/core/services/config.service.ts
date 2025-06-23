import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Configuration service for centralized application configuration management
 * 
 * Provides a clean interface to access environment settings and configuration
 * throughout the application. Includes type safety and validation.
 * 
 * @example
 * ```typescript
 * constructor(private config: ConfigService) {}
 * 
 * ngOnInit() {
 *   const apiUrl = this.config.getApiUrl();
 *   const isFeatureEnabled = this.config.isFeatureEnabled('enableWishlist');
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  /**
   * Get the base API URL
   */
  getApiUrl(): string {
    return environment.api.baseUrl;
  }
  
  /**
   * Get a specific API endpoint URL
   */
  getApiEndpoint(endpoint: keyof typeof environment.api.endpoints): string {
    return `${environment.api.baseUrl}${environment.api.endpoints[endpoint]}`;
  }
  
  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof typeof environment.features): boolean {
    return environment.features[feature];
  }
  
  /**
   * Get image storage configuration
   */
  getImageConfig() {
    return environment.media;
  }
  
  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return environment.security;
  }
  
  /**
   * Get UI configuration
   */
  getUIConfig() {
    return environment.ui;
  }
  
  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return environment.logging;
  }
  
  /**
   * Get performance configuration
   */
  getPerformanceConfig() {
    return environment.performance;
  }
  
  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return environment.production;
  }
  
  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return !environment.production;
  }
  
  /**
   * Get application version
   */
  getVersion(): string {
    return environment.version;
  }
  
  /**
   * Get third-party service configuration
   */
  getServiceConfig(service: keyof typeof environment.services) {
    return environment.services[service];
  }
  
  /**
   * Get complete environment configuration (for debugging)
   */
  getEnvironment() {
    return environment;
  }
} 