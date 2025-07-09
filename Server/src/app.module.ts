import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configurations, ConfigurationService } from './config';
import { LoggerModule, LoggerService } from './logging';
import { AuthModule } from './auth/auth.module';
import type { DatabaseConfig } from './config';

@Module({
  imports: [
    // Configuration module with typed configurations
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      load: configurations,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
    
    // Logger module - must be imported after ConfigModule
    LoggerModule,
    
    // Authentication module - includes JWT, Passport, and all auth features
    AuthModule,
    
    // MongoDB connection using ConfigService (SOLID principles)
    MongooseModule.forRootAsync({
      inject: [ConfigService, LoggerService],
      useFactory: async (configService: ConfigService, logger: LoggerService) => {
        const dbConfig = configService.get<DatabaseConfig>('database');
        
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }

        const mongooseConfig = {
          uri: dbConfig.uri,
          dbName: dbConfig.name, // Specify database name separately (Atlas best practice)
          
          // Connection Pool Settings
          maxPoolSize: dbConfig.maxPoolSize,
          minPoolSize: dbConfig.minPoolSize,
          maxIdleTimeMS: dbConfig.maxIdleTimeMS,
          waitQueueTimeoutMS: dbConfig.waitQueueTimeoutMS,
          
          // Timeout Settings
          serverSelectionTimeoutMS: dbConfig.serverSelectionTimeoutMS,
          socketTimeoutMS: dbConfig.socketTimeoutMS,
          connectTimeoutMS: dbConfig.connectTimeoutMS,
          
          // Behavior Settings
          bufferCommands: dbConfig.bufferCommands,
        };

        // Use our new logger service instead of console.log
        if (configService.get<string>('app.nodeEnv') === 'development') {
          logger.info('🔗 MongoDB Connection Configuration', 'DatabaseConnection', {
            uri: mongooseConfig.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
            database: mongooseConfig.dbName,
            poolSize: `${mongooseConfig.minPoolSize} - ${mongooseConfig.maxPoolSize}`,
            connectTimeout: `${mongooseConfig.connectTimeoutMS}ms`,
            socketTimeout: `${mongooseConfig.socketTimeoutMS}ms`,
            bufferCommands: mongooseConfig.bufferCommands,
          });
          
          logger.info('🔄 Attempting to connect to MongoDB...', 'DatabaseConnection');
        }

        return mongooseConfig;
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ConfigurationService],
})
export class AppModule {} 