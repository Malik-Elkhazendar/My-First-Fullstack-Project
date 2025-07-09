import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { LoggerService } from './logging';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  getHello(): string {
    // Demonstrate logger usage
    this.logger.info('Hello endpoint accessed', 'AppController');
    
    this.logger.logUserAction({
      event: 'app.hello.accessed',
      sessionId: 'demo-session-123',
      metadata: {
        userAgent: 'Demo Browser',
        ip: '127.0.0.1',
      },
    });

    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): object {
    const healthStatus = {
      status: 'ok',
      message: 'Fashion Forward API is running',
      timestamp: new Date().toISOString(),
    };

    // Log health check
    this.logger.info('Health check performed', 'AppController', healthStatus);

    return healthStatus;
  }

  @Get('test-logger')
  testLogger(): object {
    // Demonstrate different log levels and E-commerce logging
    this.logger.debug('Debug message from test endpoint', 'AppController');
    this.logger.info('Info message from test endpoint', 'AppController');
    this.logger.warn('Warning message from test endpoint', 'AppController');

    // Test E-commerce specific logging
    this.logger.logBusinessEvent({
      event: 'test.business.event',
      userId: 'user-123',
      orderId: 'order-456',
      productId: 'product-789',
      amount: 99.99,
      currency: 'USD',
      metadata: {
        source: 'test-endpoint',
        category: 'electronics',
      },
    });

    this.logger.logPerformanceMetric('test.endpoint.response_time', 150, 'ms', {
      endpoint: '/test-logger',
      method: 'GET',
    });

    // Test error logging
    try {
      throw new Error('This is a test error');
    } catch (error) {
      this.logger.error('Test error occurred', error as Error, 'AppController', {
        endpoint: '/test-logger',
        testCase: 'error-handling',
      });
    }

    return {
      message: 'Logger test completed',
      timestamp: new Date().toISOString(),
      logs: 'Check console and log files for output',
    };
  }
} 