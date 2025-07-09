import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoggerService } from '../../logging';
import { IPasswordService } from '../interfaces/auth.interface';

@Injectable()
export class PasswordService implements IPasswordService {
  private readonly saltRounds = 12;

  constructor(private readonly logger: LoggerService) {}

  /**
   * Hash a plain text password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      this.logger.error('Password hashing failed', error, 'PasswordService');
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Compare a plain text password with a hashed password
   */
  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logger.error('Password comparison failed', error, 'PasswordService');
      return false;
    }
  }

  /**
   * Generate a secure random token for password resets or email verification
   */
  generateSecureToken(): string {
    try {
      return crypto.randomBytes(32).toString('hex');
    } catch (error) {
      this.logger.error('Token generation failed', error, 'PasswordService');
      throw new Error('Token generation failed');
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return { isValid: errors.length === 0, errors };
  }
} 