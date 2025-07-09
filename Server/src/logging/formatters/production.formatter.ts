import { Injectable } from '@nestjs/common';
import { ILogFormatter, LogEntry, LogLevel } from '../interfaces/logger.interface';

/**
 * Production Log Formatter
 * 
 * Provides structured JSON output optimized for production environments,
 * log aggregation systems, and automated processing.
 * Follows Single Responsibility Principle - only handles JSON formatting.
 */
@Injectable()
export class ProductionFormatter implements ILogFormatter {
  private readonly sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'secret',
    'authorization',
    'creditCard',
    'ccNumber',
    'cvv',
    'ssn',
    'pin',
  ];

  format(entry: LogEntry): string {
    const logObject = {
      '@timestamp': entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      ...this.buildContextFields(entry),
      ...this.buildMetadataFields(entry),
      ...this.buildErrorFields(entry),
      ...this.buildApplicationFields(),
    };

    return JSON.stringify(logObject);
  }

  private buildContextFields(entry: LogEntry): Record<string, any> {
    const fields: Record<string, any> = {};

    if (entry.context) fields.context = entry.context;
    if (entry.correlationId) fields.correlationId = entry.correlationId;
    if (entry.userId) fields.userId = entry.userId;
    if (entry.requestId) fields.requestId = entry.requestId;

    return fields;
  }

  private buildMetadataFields(entry: LogEntry): Record<string, any> {
    if (!entry.metadata || Object.keys(entry.metadata).length === 0) {
      return {};
    }

    // Mask sensitive data in production
    const sanitizedMetadata = this.maskSensitiveData(entry.metadata);
    
    return { metadata: sanitizedMetadata };
  }

  private buildErrorFields(entry: LogEntry): Record<string, any> {
    if (!entry.error) return {};

    return {
      error: {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack,
        type: 'application_error',
      },
    };
  }

  private buildApplicationFields(): Record<string, any> {
    return {
      application: {
        name: 'fashion-forward-api',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        pid: process.pid,
      },
      host: {
        hostname: process.env.HOSTNAME || 'localhost',
        platform: process.platform,
        arch: process.arch,
      },
    };
  }

  private maskSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }

    const masked: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key)) {
        masked[key] = this.maskValue(value);
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = this.maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  private isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return this.sensitiveFields.some(sensitive => 
      lowerFieldName.includes(sensitive.toLowerCase())
    );
  }

  private maskValue(value: any): string {
    if (typeof value !== 'string') {
      return '[MASKED]';
    }

    if (value.length <= 4) {
      return '*'.repeat(value.length);
    }

    // For longer values, show first 2 and last 2 characters
    const start = value.substring(0, 2);
    const end = value.substring(value.length - 2);
    const middle = '*'.repeat(Math.max(4, value.length - 4));

    return `${start}${middle}${end}`;
  }
} 