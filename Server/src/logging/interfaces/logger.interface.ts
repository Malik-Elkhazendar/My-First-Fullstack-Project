/**
 * Log Levels Enum
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Log Entry Structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  metadata?: Record<string, any>;
  correlationId?: string;
  userId?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * E-Commerce Specific Log Events
 */
export interface ECommerceLogEvent {
  event: string;
  userId?: string;
  sessionId?: string;
  orderId?: string;
  productId?: string;
  categoryId?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

/**
 * Logger Interface - Main contract for logging operations
 */
export interface ILogger {
  debug(message: string, context?: string, metadata?: Record<string, any>): void;
  info(message: string, context?: string, metadata?: Record<string, any>): void;
  warn(message: string, context?: string, metadata?: Record<string, any>): void;
  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void;
  fatal(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void;
  
  // E-commerce specific logging
  logUserAction(event: ECommerceLogEvent): void;
  logBusinessEvent(event: ECommerceLogEvent): void;
  logSecurityEvent(event: ECommerceLogEvent): void;
  logPerformanceMetric(metric: string, value: number, unit: string, metadata?: Record<string, any>): void;
  
  // Context management
  setCorrelationId(correlationId: string): void;
  setUserId(userId: string): void;
  setRequestId(requestId: string): void;
  clearContext(): void;
}

/**
 * Log Formatter Interface
 */
export interface ILogFormatter {
  format(entry: LogEntry): string;
}

/**
 * Log Transport Interface
 */
export interface ILogTransport {
  log(entry: LogEntry): Promise<void> | void;
  shouldLog(level: LogLevel): boolean;
}

/**
 * Logger Configuration Interface
 */
export interface LoggerConfig {
  level: LogLevel;
  environment: 'development' | 'staging' | 'production';
  enableConsole: boolean;
  enableFile: boolean;
  enableExternal: boolean;
  format: 'json' | 'pretty';
  
  file?: {
    directory: string;
    filename: string;
    maxSize: string;
    maxFiles: number;
    datePattern: string;
  };
  
  external?: {
    service: 'cloudwatch' | 'datadog' | 'elk';
    endpoint?: string;
    apiKey?: string;
    region?: string;
  };
  
  performance?: {
    enableMetrics: boolean;
    slowQueryThreshold: number;
    enableRequestLogging: boolean;
  };
  
  security?: {
    enableAuditLog: boolean;
    maskSensitiveData: boolean;
    logFailedAttempts: boolean;
  };
}

/**
 * Log Context Interface
 */
export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Performance Metric Interface
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  tags?: Record<string, string>;
  timestamp: Date;
} 