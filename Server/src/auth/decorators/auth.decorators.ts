import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';
import { IUser } from '../interfaces/auth.interface';

/**
 * Decorator to mark routes as public (skip authentication)
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Decorator to specify required roles for a route
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

/**
 * Decorator to extract the current user from request
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Decorator to extract specific user property from request
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
);

/**
 * Decorator to check if user is admin
 */
export const AdminOnly = () => Roles(UserRole.Admin);

/**
 * Decorator to check if user is customer
 */
export const CustomerOnly = () => Roles(UserRole.Customer); 