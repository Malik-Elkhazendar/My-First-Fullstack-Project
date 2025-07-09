import { registerAs } from '@nestjs/config';
import { LogLevel, type LoggerConfig } from '../logging/interfaces/logger.interface';

export default registerAs('logger', (): LoggerConfig => {
  const environment = (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production';
  
  // Environment-specific defaults
  const environmentDefaults = {
    development: {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableExternal: false,
      format: 'pretty' as const,
    },
    staging: {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      enableExternal: true,
      format: 'json' as const,
    },
    production: {
      level: LogLevel.WARN,
      enableConsole: false,
      enableFile: true,
      enableExternal: true,
      format: 'json' as const,
    },
  };

  const defaults = environmentDefaults[environment];

  return {
    // Core settings
    level: (process.env.LOG_LEVEL as LogLevel) || defaults.level,
    environment,
    enableConsole: process.env.LOG_ENABLE_CONSOLE === 'true' || defaults.enableConsole,
    enableFile: process.env.LOG_ENABLE_FILE === 'true' || defaults.enableFile,
    enableExternal: process.env.LOG_ENABLE_EXTERNAL === 'true' || defaults.enableExternal,
    format: (process.env.LOG_FORMAT as 'json' | 'pretty') || defaults.format,

    // File logging configuration
    file: {
      directory: process.env.LOG_FILE_DIRECTORY || './logs',
      filename: process.env.LOG_FILE_NAME || 'fashion-forward-%DATE%.log',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '14', 10),
      datePattern: process.env.LOG_FILE_DATE_PATTERN || 'YYYY-MM-DD',
    },

    // External logging configuration
    external: {
      service: (process.env.LOG_EXTERNAL_SERVICE as 'cloudwatch' | 'datadog' | 'elk') || 'cloudwatch',
      endpoint: process.env.LOG_EXTERNAL_ENDPOINT,
      apiKey: process.env.LOG_EXTERNAL_API_KEY,
      region: process.env.LOG_EXTERNAL_REGION || 'us-east-1',
    },

    // Performance monitoring
    performance: {
      enableMetrics: process.env.LOG_PERFORMANCE_METRICS === 'true' || environment !== 'development',
      slowQueryThreshold: parseInt(process.env.LOG_SLOW_QUERY_THRESHOLD || '1000', 10), // ms
      enableRequestLogging: process.env.LOG_REQUEST_LOGGING === 'true' || environment !== 'development',
    },

    // Security and audit
    security: {
      enableAuditLog: process.env.LOG_AUDIT_ENABLED === 'true' || environment === 'production',
      maskSensitiveData: process.env.LOG_MASK_SENSITIVE === 'true' || environment === 'production',
      logFailedAttempts: process.env.LOG_FAILED_ATTEMPTS === 'true' || true,
    },
  };
}); 