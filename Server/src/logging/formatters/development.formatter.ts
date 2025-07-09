import { Injectable } from '@nestjs/common';
import { ILogFormatter, LogEntry, LogLevel } from '../interfaces/logger.interface';

/**
 * Development Log Formatter
 * 
 * Provides colorized, human-readable log output for development environment.
 * Follows Single Responsibility Principle - only handles formatting for development.
 */
@Injectable()
export class DevelopmentFormatter implements ILogFormatter {
  private readonly colors = {
    [LogLevel.DEBUG]: '\x1b[36m',    // Cyan
    [LogLevel.INFO]: '\x1b[32m',     // Green
    [LogLevel.WARN]: '\x1b[33m',     // Yellow
    [LogLevel.ERROR]: '\x1b[31m',    // Red
    [LogLevel.FATAL]: '\x1b[35m',    // Magenta
  };

  private readonly reset = '\x1b[0m';
  private readonly bold = '\x1b[1m';
  private readonly dim = '\x1b[2m';

  format(entry: LogEntry): string {
    const color = this.colors[entry.level] || '';
    const timestamp = this.formatTimestamp(entry.timestamp);
    const level = this.formatLevel(entry.level);
    const context = this.formatContext(entry.context);
    const message = this.formatMessage(entry.message);
    const metadata = this.formatMetadata(entry);
    const error = this.formatError(entry.error);

    return [
      `${this.dim}${timestamp}${this.reset}`,
      `${color}${this.bold}${level}${this.reset}`,
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
    return `${this.dim}[${context}]${this.reset}`;
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

    return `${this.dim}${JSON.stringify(metadata, null, 0)}${this.reset}`;
  }

  private formatError(error?: LogEntry['error']): string {
    if (!error) return '';

    const errorOutput = [
      `\n${this.colors[LogLevel.ERROR]}${this.bold}Error: ${error.name}${this.reset}`,
      `${this.colors[LogLevel.ERROR]}Message: ${error.message}${this.reset}`,
    ];

    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(1); // Remove first line (error message)
      const formattedStack = stackLines
        .map(line => `${this.dim}  ${line.trim()}${this.reset}`)
        .join('\n');
      
      errorOutput.push(`Stack Trace:\n${formattedStack}`);
    }

    return errorOutput.join('\n');
  }
} 