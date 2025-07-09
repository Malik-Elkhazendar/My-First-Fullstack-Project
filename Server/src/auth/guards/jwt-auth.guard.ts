import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../logging';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    if (err || !user) {
      this.logger.warn('Authentication failed', 'JwtAuthGuard', {
        url: request.url,
        error: err?.message || info?.message || 'No user found',
      });

      throw err || new UnauthorizedException('Authentication required');
    }

    // Log successful authentication only for sensitive endpoints
    if (request.url.includes('/admin')) {
      this.logger.info('Admin authentication successful', 'JwtAuthGuard', {
        userId: user.id,
        url: request.url,
      });
    }

    return user;
  }
} 