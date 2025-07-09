import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  UseGuards, 
  Request,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Query,
  Param
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Public, CurrentUser, UserId, Roles } from '../decorators/auth.decorators';
import { 
  LoginDto, 
  RegisterDto, 
  UpdateProfileDto, 
  ChangePasswordDto, 
  ForgotPasswordDto, 
  ResetPasswordDto 
} from '../dto/auth.dto';
import { UserRole } from '../enums/user-role.enum';
import { IUser, IAuthResponse } from '../interfaces/auth.interface';
import { LoggerService } from '../../logging';

@Controller('auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Register a new user
   * POST /auth/register
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(ValidationPipe) registerDto: RegisterDto): Promise<IAuthResponse> {
    const result = await this.authService.register(registerDto);
    this.logger.info('User registered successfully', 'AuthController', { userId: result.user.id });
    return result;
  }

  /**
   * Login user
   * POST /auth/login
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Request() req: any,
  ): Promise<IAuthResponse> {
    const result = await this.authService.login(loginDto);
    this.logger.info('User logged in successfully', 'AuthController', { 
      userId: result.user.id,
      ip: req.ip 
    });
    return result;
  }

  /**
   * Get current user profile
   * GET /auth/profile
   */
  @Get('profile')
  async getProfile(@CurrentUser() user: IUser): Promise<IUser> {
    return user;
  }

  /**
   * Update user profile
   * PUT /auth/profile
   */
  @Put('profile')
  async updateProfile(
    @UserId() userId: string,
    @Body(ValidationPipe) updateDto: UpdateProfileDto,
  ): Promise<IUser> {
    return this.authService.updateProfile(userId, updateDto);
  }

  /**
   * Change password
   * POST /auth/change-password
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @UserId() userId: string,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string; success: boolean }> {
    const success = await this.authService.changePassword(userId, changePasswordDto);
    return {
      message: 'Password changed successfully',
      success,
    };
  }

  /**
   * Forgot password - send reset email
   * POST /auth/forgot-password
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string; success: boolean }> {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message: 'If your email exists in our system, you will receive a password reset link',
      success: true,
    };
  }

  /**
   * Reset password using token
   * POST /auth/reset-password
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string; success: boolean }> {
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const success = await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );

    return {
      message: 'Password reset successfully',
      success,
    };
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const tokens = await this.authService.refreshToken(refreshToken);
    return {
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    };
  }

  /**
   * Verify email
   * GET /auth/verify-email/:token
   */
  @Public()
  @Get('verify-email/:token')
  async verifyEmail(
    @Param('token') token: string,
  ): Promise<{ message: string; success: boolean }> {
    const success = await this.authService.verifyEmail(token);
    return {
      message: success 
        ? 'Email verified successfully' 
        : 'Invalid or expired verification token',
      success,
    };
  }

  /**
   * Logout user (client-side token removal, server-side logging)
   * POST /auth/logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: IUser,
  ): Promise<{ message: string; success: boolean }> {
    this.logger.info('User logged out', 'AuthController', { userId: user.id });
    return {
      message: 'Logged out successfully',
      success: true,
    };
  }

  /**
   * Get user by ID (admin only)
   * GET /auth/users/:id
   */
  @Get('users/:id')
  @Roles(UserRole.Admin)
  async getUserById(
    @Param('id') userId: string,
  ): Promise<IUser | null> {
    return this.authService.getUserById(userId);
  }

  /**
   * Test endpoint to verify authentication
   * GET /auth/test
   */
  @Get('test')
  async testAuth(@CurrentUser() user: IUser): Promise<{ 
    message: string; 
    user: IUser; 
    timestamp: string 
  }> {
    return {
      message: 'Authentication working correctly',
      user,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Admin test endpoint
   * GET /auth/admin-test
   */
  @Get('admin-test')
  @Roles(UserRole.Admin)
  async testAdminAuth(@CurrentUser() user: IUser): Promise<{ 
    message: string; 
    user: IUser; 
    timestamp: string 
  }> {
    return {
      message: 'Admin authentication working correctly',
      user,
      timestamp: new Date().toISOString(),
    };
  }
} 