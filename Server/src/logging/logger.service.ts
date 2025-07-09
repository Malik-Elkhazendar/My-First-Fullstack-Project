import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  ILogger, 
  LogEntry, 
  LogLevel, 
  ECommerceLogEvent, 
  LogContext,
  LoggerConfig,
  ILogTransport,
  ILogFormatter,
} from './interfaces/logger.interface';
import { ConsoleTransport } from './transports/console.transport';
import { FileTransport } from './transports/file.transport';
import { DevelopmentFormatter } from './formatters/development.formatter';
import { ProductionFormatter } from './formatters/production.formatter';
import { CleanFormatter } from './formatters/clean.formatter';

/**
 * Logger Service
 * 
 * Main logging service that orchestrates all transports and formatters.
 * Follows SOLID principles:
 * - Single Responsibility: Manages logging operations
 * - Open/Closed: Easy to extend with new transports/formatters
 * - Dependency Inversion: Depends on abstractions (ILogTransport, ILogFormatter)
 * - Interface Segregation: Implements focused ILogger interface
 */
@Injectable()
export class LoggerService implements ILogger, OnModuleDestroy {
  private readonly transports: ILogTransport[] = [];
  private readonly context: LogContext = {};
  private readonly config: LoggerConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<LoggerConfig>('logger')!;
    
    if (!this.config) {
      throw new Error('Logger configuration not found');
    }

    this.initializeTransports();
  }

  // Core logging methods
  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, undefined, context, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, undefined, context, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, undefined, context, metadata);
  }

  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, error, context, metadata);
  }

  fatal(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, error, context, metadata);
  }

  // E-commerce specific logging methods
  logUserAction(event: ECommerceLogEvent): void {
    this.info(`User action: ${event.event}`, 'UserAction', {
      event: event.event,
      userId: event.userId,
      sessionId: event.sessionId,
      metadata: event.metadata,
    });
  }

  logBusinessEvent(event: ECommerceLogEvent): void {
    this.info(`Business event: ${event.event}`, 'BusinessEvent', {
      event: event.event,
      userId: event.userId,
      orderId: event.orderId,
      productId: event.productId,
      amount: event.amount,
      currency: event.currency,
      metadata: event.metadata,
    });
  }

  logSecurityEvent(event: ECommerceLogEvent): void {
    this.warn(`Security event: ${event.event}`, 'SecurityEvent', {
      event: event.event,
      userId: event.userId,
      sessionId: event.sessionId,
      metadata: event.metadata,
    });
  }

  logPerformanceMetric(metric: string, value: number, unit: string, metadata?: Record<string, any>): void {
    this.info(`Performance metric: ${metric}`, 'Performance', {
      metric,
      value,
      unit,
      ...metadata,
    });
  }

  // Context management
  setCorrelationId(correlationId: string): void {
    this.context.correlationId = correlationId;
  }

  setUserId(userId: string): void {
    this.context.userId = userId;
  }

  setRequestId(requestId: string): void {
    this.context.requestId = requestId;
  }

  clearContext(): void {
    Object.keys(this.context).forEach(key => {
      delete this.context[key as keyof LogContext];
    });
  }

  // Core logging implementation
  private log(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      metadata,
      correlationId: this.context.correlationId,
      userId: this.context.userId,
      requestId: this.context.requestId,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    // Send to all transports
    this.transports.forEach(transport => {
      try {
        transport.log(entry);
      } catch (transportError) {
        // Fallback to console if transport fails
        console.error(`Transport failed: ${transportError}`);
        console.log(entry);
      }
    });
  }

  private initializeTransports(): void {
    const formatter = this.createFormatter();

    // Console transport
    if (this.config.enableConsole) {
      const consoleTransport = new ConsoleTransport(formatter, this.config.level);
      this.transports.push(consoleTransport);
    }

    // File transport - always use clean formatting for files
    if (this.config.enableFile && this.config.file) {
      // Files should always use clean format without ANSI colors
      const fileFormatter = this.config.format === 'json'
        ? new ProductionFormatter()
        : new CleanFormatter(); // Use CleanFormatter for readable files without colors
      
      const fileTransport = new FileTransport(fileFormatter, this.config.file, this.config.level);
      this.transports.push(fileTransport);
    }

    // External transport would be added here
    if (this.config.enableExternal && this.config.external) {
      // TODO: Implement external transports (CloudWatch, Datadog, etc.)
      this.warn('External logging configured but not implemented yet', 'LoggerService');
    }
  }

  private createFormatter(): ILogFormatter {
    return this.config.format === 'json' || this.config.environment === 'production'
      ? new ProductionFormatter()
      : new DevelopmentFormatter();
  }

  // Utility methods for common E-commerce scenarios
  logDatabaseQuery(query: string, duration: number, context: string): void {
    const level = duration > (this.config.performance?.slowQueryThreshold || 1000) 
      ? LogLevel.WARN 
      : LogLevel.DEBUG;

    this.log(level, `Database query executed`, undefined, context, {
      query: this.maskSensitiveData(query),
      duration,
      unit: 'ms',
      slow: duration > (this.config.performance?.slowQueryThreshold || 1000),
    });
  }

  logHttpRequest(method: string, url: string, statusCode: number, duration: number, userId?: string): void {
    this.info(`${method} ${url} ${statusCode}`, 'HttpRequest', {
      method,
      url,
      statusCode,
      duration,
      userId,
      unit: 'ms',
    });
  }

  logPaymentEvent(event: string, orderId: string, amount: number, currency: string, status: string): void {
    this.info(`Payment ${event}`, 'Payment', {
      event,
      orderId,
      amount,
      currency,
      status,
    });
  }

  logInventoryChange(productId: string, change: number, newStock: number, reason: string): void {
    this.info('Inventory updated', 'Inventory', {
      productId,
      change,
      newStock,
      reason,
    });
  }

  private maskSensitiveData(data: string): string {
    // Basic SQL password masking
    return data.replace(/password\s*=\s*'[^']*'/gi, "password='***'")
               .replace(/token\s*=\s*'[^']*'/gi, "token='***'");
  }

  // Cleanup on module destroy
  async onModuleDestroy(): Promise<void> {
    // Flush any pending logs
    const flushPromises = this.transports
      .filter((transport): transport is FileTransport => 'flush' in transport)
      .map(transport => transport.flush());

    await Promise.all(flushPromises);
  }
} 