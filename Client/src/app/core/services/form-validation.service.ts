import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface ValidationRule {
  validator: ValidatorFn;
  message: string;
}

export interface ValidationConfig {
  [key: string]: ValidationRule[];
}

export interface FormErrors {
  [key: string]: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {
  private readonly emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  constructor() {}

  /**
   * Email validator with comprehensive checking
   */
  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Let required validator handle empty values
      }

      const value = control.value.trim();
      
      if (!this.emailPattern.test(value)) {
        return { email: { actualValue: value } };
      }

      // Additional checks
      if (value.length > 254) {
        return { email: { actualValue: value, reason: 'too_long' } };
      }

      const localPart = value.split('@')[0];
      if (localPart.length > 64) {
        return { email: { actualValue: value, reason: 'local_part_too_long' } };
      }

      return null;
    };
  }

  /**
   * Password strength validator
   */
  passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value;
      const errors: any = {};

      if (value.length < 8) {
        errors.minLength = true;
      }

      if (!/(?=.*[a-z])/.test(value)) {
        errors.lowercase = true;
      }

      if (!/(?=.*[A-Z])/.test(value)) {
        errors.uppercase = true;
      }

      if (!/(?=.*\d)/.test(value)) {
        errors.number = true;
      }

      if (!/(?=.*[@$!%*?&])/.test(value)) {
        errors.specialChar = true;
      }

      if (Object.keys(errors).length > 0) {
        return { passwordStrength: errors };
      }

      return null;
    };
  }

  /**
   * Password confirmation validator
   */
  passwordMatchValidator(passwordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !control.parent) {
        return null;
      }

      const password = control.parent.get(passwordField)?.value;
      const confirmPassword = control.value;

      if (password !== confirmPassword) {
        return { passwordMismatch: true };
      }

      return null;
    };
  }

  /**
   * Phone number validator
   */
  phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.replace(/\s/g, '');
      
      if (!this.phonePattern.test(value)) {
        return { phone: { actualValue: value } };
      }

      return null;
    };
  }

  /**
   * Credit card number validator (basic Luhn algorithm)
   */
  creditCardValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.replace(/\s/g, '');
      
      if (!/^\d+$/.test(value)) {
        return { creditCard: { reason: 'invalid_format' } };
      }

      if (value.length < 13 || value.length > 19) {
        return { creditCard: { reason: 'invalid_length' } };
      }

      if (!this.luhnCheck(value)) {
        return { creditCard: { reason: 'invalid_checksum' } };
      }

      return null;
    };
  }

  /**
   * URL validator
   */
  urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      try {
        new URL(control.value);
        return null;
      } catch {
        return { url: { actualValue: control.value } };
      }
    };
  }

  /**
   * Custom range validator
   */
  rangeValidator(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = parseFloat(control.value);
      
      if (isNaN(value)) {
        return { range: { actualValue: control.value, reason: 'not_a_number' } };
      }

      if (value < min || value > max) {
        return { range: { actualValue: value, min, max } };
      }

      return null;
    };
  }

  /**
   * Date range validator
   */
  dateRangeValidator(minDate?: Date, maxDate?: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const date = new Date(control.value);
      
      if (isNaN(date.getTime())) {
        return { dateRange: { reason: 'invalid_date' } };
      }

      if (minDate && date < minDate) {
        return { dateRange: { actualValue: date, minDate, reason: 'too_early' } };
      }

      if (maxDate && date > maxDate) {
        return { dateRange: { actualValue: date, maxDate, reason: 'too_late' } };
      }

      return null;
    };
  }

  /**
   * File size validator
   */
  fileSizeValidator(maxSizeInMB: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const file = control.value as File;
      if (!file || typeof file.size !== 'number') {
        return null;
      }

      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      if (file.size > maxSizeInBytes) {
        return { 
          fileSize: { 
            actualSize: file.size, 
            maxSize: maxSizeInBytes,
            actualSizeMB: (file.size / 1024 / 1024).toFixed(2),
            maxSizeMB: maxSizeInMB
          } 
        };
      }

      return null;
    };
  }

  /**
   * File type validator
   */
  fileTypeValidator(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const file = control.value as File;
      if (!file || !file.type) {
        return null;
      }

      const isAllowed = allowedTypes.some(type => {
        if (type.includes('/')) {
          return file.type === type;
        } else {
          return file.type.startsWith(type + '/');
        }
      });

      if (!isAllowed) {
        return { 
          fileType: { 
            actualType: file.type, 
            allowedTypes 
          } 
        };
      }

      return null;
    };
  }

  /**
   * Get all validation errors from a form
   */
  getFormErrors(form: FormGroup): FormErrors {
    const errors: FormErrors = {};

    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control && control.errors) {
        errors[key] = this.getErrorMessages(control.errors);
      }
    });

    return errors;
  }

  /**
   * Get user-friendly error messages
   */
  getErrorMessages(errors: ValidationErrors): string[] {
    const messages: string[] = [];

    Object.keys(errors).forEach(errorKey => {
      const errorValue = errors[errorKey];
      
      switch (errorKey) {
        case 'required':
          messages.push('This field is required');
          break;
        case 'email':
          if (errorValue.reason === 'too_long') {
            messages.push('Email address is too long');
          } else if (errorValue.reason === 'local_part_too_long') {
            messages.push('Email local part is too long');
          } else {
            messages.push('Please enter a valid email address');
          }
          break;
        case 'passwordStrength':
          if (errorValue.minLength) {
            messages.push('Password must be at least 8 characters long');
          }
          if (errorValue.lowercase) {
            messages.push('Password must contain at least one lowercase letter');
          }
          if (errorValue.uppercase) {
            messages.push('Password must contain at least one uppercase letter');
          }
          if (errorValue.number) {
            messages.push('Password must contain at least one number');
          }
          if (errorValue.specialChar) {
            messages.push('Password must contain at least one special character');
          }
          break;
        case 'passwordMismatch':
          messages.push('Passwords do not match');
          break;
        case 'phone':
          messages.push('Please enter a valid phone number');
          break;
        case 'creditCard':
          if (errorValue.reason === 'invalid_format') {
            messages.push('Credit card number must contain only numbers');
          } else if (errorValue.reason === 'invalid_length') {
            messages.push('Credit card number must be between 13 and 19 digits');
          } else {
            messages.push('Please enter a valid credit card number');
          }
          break;
        case 'url':
          messages.push('Please enter a valid URL');
          break;
        case 'range':
          if (errorValue.reason === 'not_a_number') {
            messages.push('Please enter a valid number');
          } else {
            messages.push(`Value must be between ${errorValue.min} and ${errorValue.max}`);
          }
          break;
        case 'dateRange':
          if (errorValue.reason === 'invalid_date') {
            messages.push('Please enter a valid date');
          } else if (errorValue.reason === 'too_early') {
            messages.push('Date is too early');
          } else {
            messages.push('Date is too late');
          }
          break;
        case 'fileSize':
          messages.push(`File size must not exceed ${errorValue.maxSizeMB}MB`);
          break;
        case 'fileType':
          messages.push(`File type must be one of: ${errorValue.allowedTypes.join(', ')}`);
          break;
        case 'minlength':
          messages.push(`Minimum length is ${errorValue.requiredLength} characters`);
          break;
        case 'maxlength':
          messages.push(`Maximum length is ${errorValue.requiredLength} characters`);
          break;
        case 'min':
          messages.push(`Minimum value is ${errorValue.min}`);
          break;
        case 'max':
          messages.push(`Maximum value is ${errorValue.max}`);
          break;
        case 'pattern':
          messages.push('Please enter a valid format');
          break;
        default:
          messages.push('Please enter a valid value');
      }
    });

    return messages;
  }

  /**
   * Check if form field has specific error
   */
  hasError(form: FormGroup, fieldName: string, errorType: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.touched && field.errors && field.errors[errorType]);
  }

  /**
   * Get first error message for a field
   */
  getFieldErrorMessage(form: FormGroup, fieldName: string): string | null {
    const field = form.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    const messages = this.getErrorMessages(field.errors);
    return messages.length > 0 ? messages[0] : null;
  }

  /**
   * Mark all fields as touched to trigger validation display
   */
  markAllFieldsAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control) {
        control.markAsTouched();
        
        if (control instanceof FormGroup) {
          this.markAllFieldsAsTouched(control);
        }
      }
    });
  }

  /**
   * Reset form validation state
   */
  resetValidationState(form: FormGroup): void {
    form.markAsUntouched();
    form.markAsPristine();
    
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control) {
        control.markAsUntouched();
        control.markAsPristine();
        
        if (control instanceof FormGroup) {
          this.resetValidationState(control);
        }
      }
    });
  }

  /**
   * Luhn algorithm for credit card validation
   */
  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }
} 