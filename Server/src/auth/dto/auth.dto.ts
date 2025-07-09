import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role?: UserRole;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'New password must contain at least one uppercase letter, one lowercase letter, and one number'
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmNewPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;
} 