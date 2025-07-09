import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './logger.service';
import { DevelopmentFormatter } from './formatters/development.formatter';
import { ProductionFormatter } from './formatters/production.formatter';
import { CleanFormatter } from './formatters/clean.formatter';

/**
 * Logger Module
 * 
 * Provides logging services to the entire application.
 * Made global so it's available everywhere without importing.
 * Follows the Module pattern and Dependency Injection principles.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LoggerService,
    DevelopmentFormatter,
    ProductionFormatter,
    CleanFormatter,
    {
      provide: 'ILogger',
      useExisting: LoggerService,
    },
  ],
  exports: [
    LoggerService,
    'ILogger',
  ],
})
export class LoggerModule {} 