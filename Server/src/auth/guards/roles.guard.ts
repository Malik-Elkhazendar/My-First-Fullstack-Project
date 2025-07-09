import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../logging';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No specific roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('Authorization failed - no user', 'RolesGuard', {
        url: request.url,
        requiredRoles,
      });
      
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn('Authorization failed - insufficient permissions', 'RolesGuard', {
        userId: user.id,
        userRole: user.role,
        requiredRoles,
        url: request.url,
      });
      
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
} 