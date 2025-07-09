import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { ILogTransport, ILogFormatter, LogEntry, LogLevel, LoggerConfig } from '../interfaces/logger.interface';

/**
 * File Log Transport
 * 
 * Handles writing logs to files with rotation and async operations.
 * Follows Single Responsibility Principle - only handles file operations.
 * Implements proper error handling and performance optimization.
 */
@Injectable()
export class FileTransport implements ILogTransport {
  private readonly logLevelOrder = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
    [LogLevel.FATAL]: 4,
  };

  private writeQueue: Array<{ entry: LogEntry; formattedMessage: string }> = [];
  private isProcessingQueue = false;
  private currentDate = '';
  private currentFilePath = '';

  constructor(
    private readonly formatter: ILogFormatter,
    private readonly config: LoggerConfig['file'],
    private readonly minLevel: LogLevel = LogLevel.DEBUG,
  ) {
    if (!this.config) {
      throw new Error('File transport requires file configuration');
    }

    // Initialize file system and start queue processing
    this.initializeFileSystem();
    this.processQueuePeriodically();
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formattedMessage = this.formatter.format(entry);
    
    // Add to queue for async processing
    this.writeQueue.push({ entry, formattedMessage });
    
    // Process immediately for fatal errors
    if (entry.level === LogLevel.FATAL) {
      await this.processQueue();
    }
  }

  shouldLog(level: LogLevel): boolean {
    return this.logLevelOrder[level] >= this.logLevelOrder[this.minLevel];
  }

  private async initializeFileSystem(): Promise<void> {
    try {
      if (!this.config) return;
      
      // Ensure log directory exists
      await fs.mkdir(this.config.directory, { recursive: true });
      
      // Initialize current file path
      this.updateCurrentFilePath();
      
      // Clean up old log files
      await this.cleanupOldFiles();
    } catch (error) {
      console.error('Failed to initialize file transport:', error);
    }
  }

  private updateCurrentFilePath(): void {
    if (!this.config) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (this.currentDate !== today) {
      this.currentDate = today;
      const filename = this.config.filename.replace('%DATE%', today);
      this.currentFilePath = join(this.config.directory, filename);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.writeQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    // Declare entries outside try block for catch block access
    let entries: Array<{ entry: LogEntry; formattedMessage: string }> = [];

    try {
      // Update file path if date has changed
      this.updateCurrentFilePath();

      // Process all queued entries
      entries = [...this.writeQueue];
      this.writeQueue = [];

      const logLines = entries.map(({ formattedMessage }) => formattedMessage).join('\n') + '\n';

      // Check file size before writing
      await this.rotateFileIfNeeded();

      // Write to file
      await fs.appendFile(this.currentFilePath, logLines, 'utf8');

    } catch (error) {
      console.error('Failed to write logs to file:', error);
      
      // Put entries back in queue for retry
      this.writeQueue.unshift(...entries);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async rotateFileIfNeeded(): Promise<void> {
    if (!this.config) return;

    try {
      const stats = await fs.stat(this.currentFilePath);
      const maxSizeBytes = this.parseSize(this.config.maxSize);

      if (stats.size >= maxSizeBytes) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = this.currentFilePath.replace('.log', `-${timestamp}.log`);
        
        await fs.rename(this.currentFilePath, rotatedPath);
        
        // Optionally compress the rotated file
        // await this.compressFile(rotatedPath);
      }
    } catch (error) {
      // File doesn't exist yet, which is fine
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to check file size for rotation:', error);
      }
    }
  }

  private async cleanupOldFiles(): Promise<void> {
    if (!this.config) return;

    try {
      const files = await fs.readdir(this.config.directory);
      const logFiles = files
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: join(this.config.directory, file),
        }));

      // Sort by creation time and remove old files
      if (logFiles.length > this.config.maxFiles) {
        const filesToDelete = logFiles.slice(this.config.maxFiles);
        
        for (const file of filesToDelete) {
          try {
            await fs.unlink(file.path);
          } catch (error) {
            console.error(`Failed to delete old log file ${file.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old log files:', error);
    }
  }

  private parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      'b': 1,
      'k': 1024,
      'm': 1024 * 1024,
      'g': 1024 * 1024 * 1024,
    };

    const match = sizeStr.toLowerCase().match(/^(\d+)([bkmg]?)$/);
    if (!match) {
      throw new Error(`Invalid size format: ${sizeStr}`);
    }

    const [, numStr, unit] = match;
    const num = parseInt(numStr, 10);
    const multiplier = units[unit] || 1;

    return num * multiplier;
  }

  private processQueuePeriodically(): void {
    // Process queue every 1 second
    setInterval(() => {
      this.processQueue().catch(error => {
        console.error('Error processing log queue:', error);
      });
    }, 1000);
  }

  // Cleanup method for graceful shutdown
  async flush(): Promise<void> {
    await this.processQueue();
  }
} 