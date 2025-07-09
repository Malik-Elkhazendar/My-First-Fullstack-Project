import { Injectable } from '@nestjs/common';
import { ILogFormatter, LogEntry, LogLevel } from '../interfaces/logger.interface';

/**
 * Clean Log Formatter
 * 
 * Provides clean, readable log output without ANSI color codes.
 * Perfect for file logging in development environments.
 * Follows Single Responsibility Principle - only handles clean formatting.
 */
@Injectable()
export class CleanFormatter implements ILogFormatter {
  format(entry: LogEntry): string {
    const timestamp = this.formatTimestamp(entry.timestamp);
    const level = this.formatLevel(entry.level);
    const context = this.formatContext(entry.context);
    const message = this.formatMessage(entry.message);
    const metadata = this.formatMetadata(entry);
    const error = this.formatError(entry.error);

    return [
      timestamp,
      level,
      context,
      message,
      metadata,
      error,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private formatTimestamp(timestamp: Date): string {
    return timestamp.toISOString().replace('T', ' ').replace('Z', '');
  }

  private formatLevel(level: LogLevel): string {
    return `[${level.toUpperCase().padEnd(5)}]`;
  }

  private formatContext(context?: string): string {
    if (!context) return '';
    return `[${context}]`;
  }

  private formatMessage(message: string): string {
    return message;
  }

  private formatMetadata(entry: LogEntry): string {
    const metadata: Record<string, any> = {};

    // Add correlation information
    if (entry.correlationId) metadata.correlationId = entry.correlationId;
    if (entry.userId) metadata.userId = entry.userId;
    if (entry.requestId) metadata.requestId = entry.requestId;

    // Add custom metadata
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      Object.assign(metadata, entry.metadata);
    }

    if (Object.keys(metadata).length === 0) return '';

    return JSON.stringify(metadata, null, 0);
  }

  private formatError(error?: LogEntry['error']): string {
    if (!error) return '';

    const errorOutput = [
      `\nError: ${error.name}`,
      `Message: ${error.message}`,
    ];

    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(1); // Remove first line (error message)
      const formattedStack = stackLines
        .map(line => `  ${line.trim()}`)
        .join('\n');
      
      errorOutput.push(`Stack Trace:\n${formattedStack}`);
    }

    return errorOutput.join('\n');
  }
} 