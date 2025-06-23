/**
 * Validation result interface
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  message?: string;
  /** Additional error details */
  details?: Record<string, any>;
}

/**
 * Email validation options
 */
export interface EmailValidationOptions {
  /** Allow plus signs in email addresses */
  allowPlus?: boolean;
  /** Require top-level domain */
  requireTLD?: boolean;
  /** Custom domain whitelist */
  allowedDomains?: string[];
  /** Custom domain blacklist */
  blockedDomains?: string[];
}

/**
 * Password validation options
 */
export interface PasswordValidationOptions {
  /** Minimum length (default: 8) */
  minLength?: number;
  /** Maximum length (default: 128) */
  maxLength?: number;
  /** Require at least one uppercase letter */
  requireUppercase?: boolean;
  /** Require at least one lowercase letter */
  requireLowercase?: boolean;
  /** Require at least one number */
  requireNumbers?: boolean;
  /** Require at least one special character */
  requireSpecialChars?: boolean;
  /** Custom special characters (default: !@#$%^&*()_+-=[]{}|;:,.<>?) */
  specialChars?: string;
  /** Disallow common passwords */
  disallowCommon?: boolean;
}

/**
 * Comprehensive validation utilities for forms and data validation
 * 
 * Provides type-safe validation functions with detailed error messages
 * and customizable validation options.
 * 
 * @example
 * ```typescript
 * import { ValidationUtils } from '@shared/utils';
 * 
 * // Email validation
 * const emailResult = ValidationUtils.validateEmail('user@example.com');
 * if (!emailResult.isValid) {
 *   console.error(emailResult.message);
 * }
 * 
 * // Password validation
 * const passwordResult = ValidationUtils.validatePassword('MySecurePass123!', {
 *   minLength: 12,
 *   requireSpecialChars: true
 * });
 * ```
 * 
 * @since 1.0.0
 * @author Fashion Forward Team
 */
export class ValidationUtils {
  
  /** Common password patterns to avoid */
  private static readonly COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  /** Email regex pattern (RFC 5322 compliant) */
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  /** Phone number regex (international format) */
  private static readonly PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

  /** URL regex pattern */
  private static readonly URL_REGEX = /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/;

  /**
   * Validate email address with comprehensive options
   * 
   * @param email - Email address to validate
   * @param options - Validation options
   * @returns Validation result with details
   * 
   * @example
   * ```typescript
   * const result = ValidationUtils.validateEmail('user@example.com', {
   *   requireTLD: true,
   *   allowedDomains: ['example.com', 'company.org']
   * });
   * 
   * if (!result.isValid) {
   *   console.error(result.message);
   * }
   * ```
   */
  static validateEmail(email: string, options: EmailValidationOptions = {}): ValidationResult {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        message: 'Email is required'
      };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Basic format validation
    if (!this.EMAIL_REGEX.test(trimmedEmail)) {
      return {
        isValid: false,
        message: 'Please enter a valid email address'
      };
    }

    // Plus sign validation
    if (!options.allowPlus && trimmedEmail.includes('+')) {
      return {
        isValid: false,
        message: 'Email addresses with plus signs are not allowed'
      };
    }

    const [localPart, domain] = trimmedEmail.split('@');

    // TLD validation
    if (options.requireTLD !== false && !domain.includes('.')) {
      return {
        isValid: false,
        message: 'Email must include a valid domain'
      };
    }

    // Domain whitelist
    if (options.allowedDomains && !options.allowedDomains.includes(domain)) {
      return {
        isValid: false,
        message: `Email domain must be one of: ${options.allowedDomains.join(', ')}`
      };
    }

    // Domain blacklist
    if (options.blockedDomains && options.blockedDomains.includes(domain)) {
      return {
        isValid: false,
        message: 'This email domain is not allowed'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate password with comprehensive security requirements
   * 
   * @param password - Password to validate
   * @param options - Validation options
   * @returns Validation result with specific requirements
   * 
   * @example
   * ```typescript
   * const result = ValidationUtils.validatePassword('MySecurePass123!', {
   *   minLength: 12,
   *   requireUppercase: true,
   *   requireNumbers: true,
   *   requireSpecialChars: true
   * });
   * ```
   */
  static validatePassword(password: string, options: PasswordValidationOptions = {}): ValidationResult {
    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        message: 'Password is required'
      };
    }

    const opts: Required<PasswordValidationOptions> = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      disallowCommon: true,
      ...options
    };

    const errors: string[] = [];

    // Length validation
    if (password.length < opts.minLength) {
      errors.push(`Password must be at least ${opts.minLength} characters long`);
    }

    if (password.length > opts.maxLength) {
      errors.push(`Password must be no more than ${opts.maxLength} characters long`);
    }

    // Character requirements
    if (opts.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (opts.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (opts.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (opts.requireSpecialChars) {
      const specialCharsRegex = new RegExp(`[${opts.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
      if (!specialCharsRegex.test(password)) {
        errors.push(`Password must contain at least one special character (${opts.specialChars})`);
      }
    }

    // Common password check
    if (opts.disallowCommon && this.COMMON_PASSWORDS.some(common => 
      password.toLowerCase().includes(common.toLowerCase())
    )) {
      errors.push('Password is too common. Please choose a more secure password');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        message: errors[0], // Return first error
        details: { allErrors: errors }
      };
    }

    return { isValid: true };
  }

  /**
   * Validate phone number with international format support
   * 
   * @param phone - Phone number to validate
   * @param allowInternational - Whether to allow international format
   * @returns Validation result
   * 
   * @example
   * ```typescript
   * const result = ValidationUtils.validatePhone('+1234567890', true);
   * ```
   */
  static validatePhone(phone: string, allowInternational: boolean = true): ValidationResult {
    if (!phone || typeof phone !== 'string') {
      return {
        isValid: false,
        message: 'Phone number is required'
      };
    }

    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');

    if (allowInternational) {
      if (!this.PHONE_REGEX.test(cleanPhone)) {
        return {
          isValid: false,
          message: 'Please enter a valid phone number'
        };
      }
    } else {
      // US format validation
      const usPhoneRegex = /^[2-9]\d{2}[2-9]\d{2}\d{4}$/;
      if (!usPhoneRegex.test(cleanPhone.replace(/^\+?1/, ''))) {
        return {
          isValid: false,
          message: 'Please enter a valid US phone number'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate URL format
   * 
   * @param url - URL to validate
   * @param requireHttps - Whether to require HTTPS
   * @returns Validation result
   * 
   * @example
   * ```typescript
   * const result = ValidationUtils.validateUrl('https://example.com', true);
   * ```
   */
  static validateUrl(url: string, requireHttps: boolean = false): ValidationResult {
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        message: 'URL is required'
      };
    }

    if (!this.URL_REGEX.test(url)) {
      return {
        isValid: false,
        message: 'Please enter a valid URL'
      };
    }

    if (requireHttps && !url.startsWith('https://')) {
      return {
        isValid: false,
        message: 'URL must use HTTPS'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate required field
   * 
   * @param value - Value to validate
   * @param fieldName - Name of the field for error message
   * @returns Validation result
   */
  static validateRequired(value: any, fieldName: string = 'Field'): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return {
        isValid: false,
        message: `${fieldName} is required`
      };
    }

    if (typeof value === 'string' && value.trim() === '') {
      return {
        isValid: false,
        message: `${fieldName} cannot be empty`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate string length
   * 
   * @param value - String to validate
   * @param minLength - Minimum length
   * @param maxLength - Maximum length
   * @param fieldName - Field name for error message
   * @returns Validation result
   */
  static validateLength(
    value: string, 
    minLength: number = 0, 
    maxLength: number = Infinity,
    fieldName: string = 'Field'
  ): ValidationResult {
    if (typeof value !== 'string') {
      return {
        isValid: false,
        message: `${fieldName} must be a string`
      };
    }

    if (value.length < minLength) {
      return {
        isValid: false,
        message: `${fieldName} must be at least ${minLength} characters long`
      };
    }

    if (value.length > maxLength) {
      return {
        isValid: false,
        message: `${fieldName} must be no more than ${maxLength} characters long`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate number range
   * 
   * @param value - Number to validate
   * @param min - Minimum value
   * @param max - Maximum value
   * @param fieldName - Field name for error message
   * @returns Validation result
   */
  static validateRange(
    value: number, 
    min: number = -Infinity, 
    max: number = Infinity,
    fieldName: string = 'Value'
  ): ValidationResult {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        isValid: false,
        message: `${fieldName} must be a valid number`
      };
    }

    if (value < min) {
      return {
        isValid: false,
        message: `${fieldName} must be at least ${min}`
      };
    }

    if (value > max) {
      return {
        isValid: false,
        message: `${fieldName} must be no more than ${max}`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate date range
   * 
   * @param date - Date to validate
   * @param minDate - Minimum date
   * @param maxDate - Maximum date
   * @param fieldName - Field name for error message
   * @returns Validation result
   */
  static validateDateRange(
    date: Date | string, 
    minDate?: Date, 
    maxDate?: Date,
    fieldName: string = 'Date'
  ): ValidationResult {
    let dateObj: Date;

    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return {
        isValid: false,
        message: `${fieldName} must be a valid date`
      };
    }

    if (isNaN(dateObj.getTime())) {
      return {
        isValid: false,
        message: `${fieldName} must be a valid date`
      };
    }

    if (minDate && dateObj < minDate) {
      return {
        isValid: false,
        message: `${fieldName} must be after ${minDate.toLocaleDateString()}`
      };
    }

    if (maxDate && dateObj > maxDate) {
      return {
        isValid: false,
        message: `${fieldName} must be before ${maxDate.toLocaleDateString()}`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate credit card number using Luhn algorithm
   * 
   * @param cardNumber - Credit card number to validate
   * @returns Validation result with card type
   */
  static validateCreditCard(cardNumber: string): ValidationResult & { cardType?: string } {
    if (!cardNumber || typeof cardNumber !== 'string') {
      return {
        isValid: false,
        message: 'Credit card number is required'
      };
    }

    const cleanNumber = cardNumber.replace(/\D/g, '');

    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return {
        isValid: false,
        message: 'Credit card number must be between 13 and 19 digits'
      };
    }

    // Luhn algorithm validation
    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    if (sum % 10 !== 0) {
      return {
        isValid: false,
        message: 'Invalid credit card number'
      };
    }

    // Determine card type
    let cardType = 'Unknown';
    if (/^4/.test(cleanNumber)) cardType = 'Visa';
    else if (/^5[1-5]/.test(cleanNumber)) cardType = 'MasterCard';
    else if (/^3[47]/.test(cleanNumber)) cardType = 'American Express';
    else if (/^6/.test(cleanNumber)) cardType = 'Discover';

    return { 
      isValid: true, 
      cardType,
      details: { cardType }
    };
  }

  /**
   * Validate multiple fields at once
   * 
   * @param validations - Array of validation functions
   * @returns Combined validation result
   * 
   * @example
   * ```typescript
   * const result = ValidationUtils.validateMultiple([
   *   () => ValidationUtils.validateRequired(email, 'Email'),
   *   () => ValidationUtils.validateEmail(email),
   *   () => ValidationUtils.validateRequired(password, 'Password'),
   *   () => ValidationUtils.validatePassword(password)
   * ]);
   * ```
   */
  static validateMultiple(validations: (() => ValidationResult)[]): ValidationResult {
    const errors: string[] = [];
    const details: Record<string, any> = {};

    for (const validation of validations) {
      try {
        const result = validation();
        if (!result.isValid) {
          errors.push(result.message || 'Validation failed');
          if (result.details) {
            Object.assign(details, result.details);
          }
        }
      } catch (error) {
        errors.push('Validation error occurred');
        console.error('Validation function error:', error);
      }
    }

    return {
      isValid: errors.length === 0,
      message: errors[0],
      details: { allErrors: errors, ...details }
    };
  }
} 
 