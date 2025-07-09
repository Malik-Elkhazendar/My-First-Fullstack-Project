import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { LoggerService } from './logging';
import type { AppConfig, CorsConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service (Dependency Injection)
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  const appConfig = configService.get<AppConfig>('app');
  const corsConfig = configService.get<CorsConfig>('cors');

  if (!appConfig || !corsConfig) {
    throw new Error('Application configuration not found');
  }

  // Enable CORS with configuration service
  app.enableCors({
    origin: corsConfig.origin,
    methods: corsConfig.methods,
    credentials: corsConfig.credentials,
    optionsSuccessStatus: 200,
  });

  // Global validation pipe with environment-based configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: appConfig.nodeEnv === 'production',
      validateCustomDecorators: true,
    }),
  );

  // API prefix from configuration
  app.setGlobalPrefix(appConfig.apiPrefix);

  await app.listen(appConfig.port, '0.0.0.0');
  
  // Enhanced logging using our new logger service
  if (appConfig.nodeEnv === 'development') {
    logger.info('🚀 Fashion Forward API is running!', 'Application');
    logger.info('Application startup completed', 'Application', {
      environment: appConfig.nodeEnv,
      port: appConfig.port,
      apiPrefix: appConfig.apiPrefix,
      url: `http://localhost:${appConfig.port}/${appConfig.apiPrefix}`,
      corsOrigin: corsConfig.origin,
      healthCheck: `http://localhost:${appConfig.port}/${appConfig.apiPrefix}/health`,
    });
  } else {
    logger.info(`🚀 Fashion Forward API started on port ${appConfig.port}`, 'Application', {
      environment: appConfig.nodeEnv,
      port: appConfig.port,
    });
  }

  // Log application performance metrics
  logger.logPerformanceMetric('application.startup_time', Date.now() - startTime, 'ms', {
    environment: appConfig.nodeEnv,
    nodeVersion: process.version,
  });
}

const startTime = Date.now();

bootstrap().catch((error) => {
  // Use console.error for bootstrap errors since logger might not be available
  console.error('❌ Failed to start the application:', error);
  process.exit(1);
}); 