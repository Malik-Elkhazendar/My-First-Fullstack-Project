import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlingService, AppError } from '../../../core/services/error-handling.service';
import { LoadingService } from '../../../core/services/loading.service';
import { FormValidationService } from '../../../core/services/form-validation.service';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface ValidationState {
  [key: string]: {
    touched: boolean;
    errors: string[];
    showErrors: boolean;
  };
}

/**
 * Enhanced Register Component with comprehensive validation and user feedback
 * 
 * Features:
 * - Advanced form validation with custom validators
 * - Real-time validation feedback with password strength indicator
 * - Loading states and error handling
 * - Success/error toast notifications
 * - Accessibility improvements
 * - Type-safe form handling
 * - Password match validation
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  loading = false;
  submitted = false;
  hidePassword = true;
  hideConfirmPassword = true;
  registerError: AppError | null = null;
  validationState: ValidationState = {};
  
  // Form interaction tracking
  formInteracted = false;
  passwordStrength = 0;
  
  private destroy$ = new Subject<void>();
  private readonly LOADING_KEY = 'register';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private errorHandler: ErrorHandlingService,
    private loadingService: LoadingService,
    private formValidation: FormValidationService
  ) {
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    }

    this.initializeForm();
    this.setupFormValidation();
  }

  ngOnInit(): void {
    // Subscribe to loading state
    this.loadingService.isLoading(this.LOADING_KEY)
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        this.loading = isLoading;
      });

    // Track form interactions for better UX
    this.registerForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formInteracted = true;
        this.updateValidationState();
        this.updatePasswordStrength();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the registration form with enhanced validation
   */
  private initializeForm(): void {
    this.registerForm = this.formBuilder.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.formValidation.nameValidator()
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        this.formValidation.nameValidator()
      ]],
      email: ['', [
        Validators.required,
        this.formValidation.emailValidator()
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        this.formValidation.passwordValidator()
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      agreeTerms: [false, [
        Validators.requiredTrue
      ]]
    }, {
      validators: [this.createPasswordMatchValidator()]
    });
  }

  /**
   * Setup advanced form validation and real-time feedback
   */
  private setupFormValidation(): void {
    // Initialize validation state for each field
    Object.keys(this.registerForm.controls).forEach(fieldName => {
      this.validationState[fieldName] = {
        touched: false,
        errors: [],
        showErrors: false
      };

      // Subscribe to field changes for real-time validation
      const control = this.registerForm.get(fieldName);
      if (control) {
        control.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.updateFieldValidation(fieldName);
          });

        // Track when field is touched
        control.statusChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            if (control.touched && !this.validationState[fieldName].touched) {
              this.validationState[fieldName].touched = true;
              this.updateFieldValidation(fieldName);
            }
          });
      }
    });
  }

  /**
   * Update validation state for all fields
   */
  private updateValidationState(): void {
    Object.keys(this.registerForm.controls).forEach(fieldName => {
      this.updateFieldValidation(fieldName);
    });
    
    // Handle form-level validation (password match)
    this.updateFormLevelValidation();
  }

  /**
   * Update validation state for a specific field
   */
  private updateFieldValidation(fieldName: string): void {
    const control = this.registerForm.get(fieldName);
    if (!control) return;

    const state = this.validationState[fieldName];
    state.errors = control.errors ? this.formValidation.getErrorMessages(control.errors) : [];
    
    // Show errors if field is touched, form is submitted, or user has interacted with form
    state.showErrors = (control.touched || this.submitted || this.formInteracted) && state.errors.length > 0;
  }

  /**
   * Handle form-level validation (password match)
   */
  private updateFormLevelValidation(): void {
    if (this.registerForm.errors?.['passwordMismatch']) {
      const confirmPasswordState = this.validationState['confirmPassword'];
      if (!confirmPasswordState.errors.includes('Passwords do not match')) {
        confirmPasswordState.errors.push('Passwords do not match');
        confirmPasswordState.showErrors = this.formInteracted || this.submitted;
      }
    } else {
      const confirmPasswordState = this.validationState['confirmPassword'];
      confirmPasswordState.errors = confirmPasswordState.errors.filter(
        error => error !== 'Passwords do not match'
      );
    }
  }

  /**
   * Update password strength indicator
   */
  private updatePasswordStrength(): void {
    const password = this.registerForm.get('password')?.value || '';
    this.passwordStrength = this.formValidation.calculatePasswordStrength(password);
  }

  /**
   * Password match validator
   */
  private createPasswordMatchValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      
      if (!password || !confirmPassword) {
        return null;
      }
      
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  // Convenience getter for easy access to form fields
  get f() { 
    return this.registerForm.controls; 
  }

  /**
   * Check if a specific form field has errors to display
   */
  hasFieldErrors(fieldName: string): boolean {
    return this.validationState[fieldName]?.showErrors || false;
  }

  /**
   * Get error messages for a specific field
   */
  getFieldErrors(fieldName: string): string[] {
    return this.validationState[fieldName]?.errors || [];
  }

  /**
   * Get the first error message for a field (for primary display)
   */
  getFieldErrorMessage(fieldName: string): string | null {
    const errors = this.getFieldErrors(fieldName);
    return errors.length > 0 ? errors[0] : null;
  }

  /**
   * Check if a specific field has a specific error (used by template)
   */
  hasError(fieldName: string, errorType: string): boolean {
    const control = this.registerForm.get(fieldName);
    if (!control) return false;
    
    // For custom validators like passwordStrength
    if (errorType === 'passwordStrength') {
      return control.hasError('passwordStrength') && (control.touched || this.submitted);
    }
    
    return control.hasError(errorType) && (control.touched || this.submitted);
  }

  /**
   * Check if passwords don't match (used by template)
   */
  hasPasswordMismatch(): boolean {
    const confirmPasswordControl = this.registerForm.get('confirmPassword');
    return this.registerForm.hasError('passwordMismatch') && 
           (confirmPasswordControl?.touched || this.submitted);
  }

  /**
   * Check if the form is valid and ready to submit
   */
  get isFormValid(): boolean {
    return this.registerForm.valid && !this.loading;
  }

  /**
   * Get form validation summary for accessibility
   */
  get validationSummary(): string {
    const errors = this.formValidation.getFormErrors(this.registerForm);
    const errorCount = Object.keys(errors).length;
    
    if (errorCount === 0) {
      return 'Form is valid';
    }
    
    return `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}`;
  }

  /**
   * Get password strength label
   */
  get passwordStrengthLabel(): string {
    if (this.passwordStrength < 25) return 'Weak';
    if (this.passwordStrength < 50) return 'Fair';
    if (this.passwordStrength < 75) return 'Good';
    return 'Strong';
  }

  /**
   * Get password strength color
   */
  get passwordStrengthColor(): string {
    if (this.passwordStrength < 25) return 'bg-red-500';
    if (this.passwordStrength < 50) return 'bg-yellow-500';
    if (this.passwordStrength < 75) return 'bg-blue-500';
    return 'bg-green-500';
  }

  /**
   * Enhanced form submission with comprehensive error handling
   */
  onSubmit(): void {
    this.submitted = true;
    this.registerError = null;

    // Validate form
    if (this.registerForm.invalid) {
      this.handleFormValidationErrors();
      return;
    }

    // Prepare registration data
    const registerData: RegisterFormData = {
      firstName: this.f['firstName'].value.trim(),
      lastName: this.f['lastName'].value.trim(),
      email: this.f['email'].value.trim().toLowerCase(),
      password: this.f['password'].value,
      confirmPassword: this.f['confirmPassword'].value,
      agreeTerms: this.f['agreeTerms'].value
    };

    // Perform registration with loading state management
    this.loadingService.withLoading(
      this.LOADING_KEY,
      this.authService.register(registerData)
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.handleRegistrationSuccess(registerData.firstName);
      },
      error: (error: AppError) => {
        this.handleRegistrationError(error);
      }
    });
  }

  /**
   * Handle form validation errors
   */
  private handleFormValidationErrors(): void {
    // Mark all fields as touched to show validation errors
    this.formValidation.markAllFieldsAsTouched(this.registerForm);
    this.updateValidationState();

    // Show validation summary
    const errors = this.formValidation.getFormErrors(this.registerForm);
    const errorCount = Object.keys(errors).length;
    
    this.errorHandler.showErrorNotification(
      `Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''} before submitting.`
    );

    // Focus on first invalid field for accessibility
    this.focusFirstInvalidField();
  }

  /**
   * Handle successful registration
   */
  private handleRegistrationSuccess(firstName: string): void {
    this.registerError = null;
    
    // Show success notification
    this.errorHandler.showSuccessNotification(
      `Welcome to Fashion Forward, ${firstName}! Your account has been created successfully.`
    );

    // Navigate to dashboard or home
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 1000);
  }

  /**
   * Handle registration errors with enhanced feedback
   */
  private handleRegistrationError(error: AppError): void {
    this.registerError = error;

    // Show appropriate error message based on error type
    let userMessage = 'Registration failed. Please try again.';
    
    switch (error.code) {
      case 'EMAIL_EXISTS':
        userMessage = 'An account with this email already exists. Please try signing in instead.';
        break;
      case 'WEAK_PASSWORD':
        userMessage = 'Password is too weak. Please choose a stronger password.';
        break;
      case 'INVALID_EMAIL':
        userMessage = 'Please enter a valid email address.';
        break;
      case 'NETWORK_ERROR':
        userMessage = 'Network error. Please check your connection and try again.';
        break;
      case 'VALIDATION_ERROR':
        userMessage = 'Please check your input and try again.';
        break;
      default:
        userMessage = this.errorHandler.getUserFriendlyMessage(error);
    }

    this.errorHandler.showErrorNotification(userMessage);

    // Focus on appropriate field based on error
    this.focusRelevantField(error);
  }

  /**
   * Focus on the first invalid form field
   */
  private focusFirstInvalidField(): void {
    const firstInvalidField = Object.keys(this.registerForm.controls)
      .find(fieldName => {
        const control = this.registerForm.get(fieldName);
        return control && control.invalid;
      });

    if (firstInvalidField) {
      setTimeout(() => {
        const element = document.querySelector(`input[formControlName="${firstInvalidField}"]`) as HTMLElement;
        if (element) {
          element.focus();
        }
      }, 100);
    }
  }

  /**
   * Focus on relevant field based on error type
   */
  private focusRelevantField(error: AppError): void {
    let fieldToFocus = 'firstName';
    
    switch (error.code) {
      case 'EMAIL_EXISTS':
      case 'INVALID_EMAIL':
        fieldToFocus = 'email';
        break;
      case 'WEAK_PASSWORD':
        fieldToFocus = 'password';
        break;
      default:
        fieldToFocus = 'firstName';
    }

    setTimeout(() => {
      const element = document.querySelector(`input[formControlName="${fieldToFocus}"]`) as HTMLElement;
      if (element) {
        element.focus();
        if (element instanceof HTMLInputElement) {
          element.select();
        }
      }
    }, 100);
  }

  /**
   * Toggle password visibility with accessibility
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
    
    // Announce to screen readers
    const announcement = this.hidePassword ? 'Password hidden' : 'Password visible';
    this.errorHandler.showInfoNotification(announcement, 1000);
  }

  /**
   * Toggle confirm password visibility with accessibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
    
    // Announce to screen readers
    const announcement = this.hideConfirmPassword ? 'Confirm password hidden' : 'Confirm password visible';
    this.errorHandler.showInfoNotification(announcement, 1000);
  }

  /**
   * Handle input focus for better UX
   */
  onFieldFocus(fieldName: string): void {
    // Clear field-specific errors when user starts typing
    if (this.validationState[fieldName]?.showErrors) {
      this.validationState[fieldName].showErrors = false;
    }
  }

  /**
   * Handle input blur for validation
   */
  onFieldBlur(fieldName: string): void {
    const control = this.registerForm.get(fieldName);
    if (control) {
      control.markAsTouched();
      this.updateFieldValidation(fieldName);
    }
  }

  /**
   * Clear all form errors and reset validation state
   */
  clearErrors(): void {
    this.registerError = null;
    this.submitted = false;
    
    Object.keys(this.validationState).forEach(fieldName => {
      this.validationState[fieldName].showErrors = false;
    });
  }

  /**
   * Reset the form to initial state
   */
  resetForm(): void {
    this.registerForm.reset();
    this.formValidation.resetValidationState(this.registerForm);
    this.clearErrors();
    this.formInteracted = false;
    this.passwordStrength = 0;
  }
} 