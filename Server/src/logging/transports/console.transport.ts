import { Injectable } from '@nestjs/common';
import { ILogTransport, ILogFormatter, LogEntry, LogLevel } from '../interfaces/logger.interface';

/**
 * Console Log Transport
 * 
 * Handles outputting logs to the console/stdout.
 * Follows Single Responsibility Principle - only handles console output.
 * Supports dependency injection of formatters (Dependency Inversion).
 */
@Injectable()
export class ConsoleTransport implements ILogTransport {
  private readonly logLevelOrder = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
    [LogLevel.FATAL]: 4,
  };

  constructor(
    private readonly formatter: ILogFormatter,
    private readonly minLevel: LogLevel = LogLevel.DEBUG,
  ) {}

  log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formattedMessage = this.formatter.format(entry);
    this.writeToConsole(entry.level, formattedMessage);
  }

  shouldLog(level: LogLevel): boolean {
    return this.logLevelOrder[level] >= this.logLevelOrder[this.minLevel];
  }

  private writeToConsole(level: LogLevel, message: string): void {
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message);
        break;
      default:
        console.log(message);
    }
  }
} 