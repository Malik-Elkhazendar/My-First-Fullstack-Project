import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlingService, AppError } from '../../../core/services/error-handling.service';
import { LoadingService } from '../../../core/services/loading.service';
import { FormValidationService } from '../../../core/services/form-validation.service';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationState {
  [key: string]: {
    touched: boolean;
    errors: string[];
    showErrors: boolean;
  };
}

/**
 * Enhanced Login Component with comprehensive validation and user feedback
 * 
 * Features:
 * - Advanced form validation with custom validators
 * - Real-time validation feedback
 * - Loading states and error handling
 * - Success/error toast notifications
 * - Accessibility improvements
 * - Type-safe form handling
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string = '/';
  hidePassword = true;
  loginError: AppError | null = null;
  validationState: ValidationState = {};
  
  // Form interaction tracking
  formInteracted = false;
  lastSubmitAttempt: Date | null = null;
  
  private destroy$ = new Subject<void>();
  private readonly LOADING_KEY = 'login';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
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
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Subscribe to loading state
    this.loadingService.isLoading(this.LOADING_KEY)
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        this.loading = isLoading;
      });

    // Track form interactions for better UX
    this.loginForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formInteracted = true;
        this.updateValidationState();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the login form with enhanced validation
   */
  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [
        Validators.required,
        this.formValidation.emailValidator()
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(128)
      ]],
      rememberMe: [false]
    });
  }

  /**
   * Setup advanced form validation and real-time feedback
   */
  private setupFormValidation(): void {
    // Initialize validation state for each field
    Object.keys(this.loginForm.controls).forEach(fieldName => {
      this.validationState[fieldName] = {
        touched: false,
        errors: [],
        showErrors: false
      };

      // Subscribe to field changes for real-time validation
      const control = this.loginForm.get(fieldName);
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
    Object.keys(this.loginForm.controls).forEach(fieldName => {
      this.updateFieldValidation(fieldName);
    });
  }

  /**
   * Update validation state for a specific field
   */
  private updateFieldValidation(fieldName: string): void {
    const control = this.loginForm.get(fieldName);
    if (!control) return;

    const state = this.validationState[fieldName];
    state.errors = control.errors ? this.formValidation.getErrorMessages(control.errors) : [];
    
    // Show errors if field is touched, form is submitted, or user has interacted with form
    state.showErrors = (control.touched || this.submitted || this.formInteracted) && state.errors.length > 0;
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() { 
    return this.loginForm.controls; 
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
   * Check if the form is valid and ready to submit
   */
  get isFormValid(): boolean {
    return this.loginForm.valid && !this.loading;
  }

  /**
   * Get form validation summary for accessibility
   */
  get validationSummary(): string {
    const errors = this.formValidation.getFormErrors(this.loginForm);
    const errorCount = Object.keys(errors).length;
    
    if (errorCount === 0) {
      return 'Form is valid';
    }
    
    return `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}`;
  }

  /**
   * Enhanced form submission with comprehensive error handling
   */
  onSubmit(): void {
    this.submitted = true;
    this.loginError = null;
    this.lastSubmitAttempt = new Date();

    // Validate form
    if (this.loginForm.invalid) {
      this.handleFormValidationErrors();
      return;
    }

    // Prepare login data
    const loginData: LoginFormData = {
      email: this.f['email'].value.trim().toLowerCase(),
      password: this.f['password'].value,
      rememberMe: this.f['rememberMe'].value
    };

    // Perform login with loading state management
    this.loadingService.withLoading(
      this.LOADING_KEY,
      this.authService.login(loginData)
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.handleLoginSuccess(loginData.email);
      },
      error: (error: AppError) => {
        this.handleLoginError(error);
      }
    });
  }

  /**
   * Handle form validation errors
   */
  private handleFormValidationErrors(): void {
    // Mark all fields as touched to show validation errors
    this.formValidation.markAllFieldsAsTouched(this.loginForm);
    this.updateValidationState();

    // Show validation summary
    const errors = this.formValidation.getFormErrors(this.loginForm);
    const errorCount = Object.keys(errors).length;
    
    this.errorHandler.showErrorNotification(
      `Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''} before submitting.`
    );

    // Focus on first invalid field for accessibility
    this.focusFirstInvalidField();
  }

  /**
   * Handle successful login
   */
  private handleLoginSuccess(email: string): void {
    this.loginError = null;
    
    // Show success notification
    this.errorHandler.showSuccessNotification(
      `Welcome back! Successfully signed in as ${email}`
    );

    // Navigate to return URL or dashboard
    setTimeout(() => {
      this.router.navigate([this.returnUrl]);
    }, 500);
  }

  /**
   * Handle login errors with enhanced feedback
   */
  private handleLoginError(error: AppError): void {
    this.loginError = error;

    // Show appropriate error message based on error type
    let userMessage = 'Login failed. Please try again.';
    
    switch (error.code) {
      case 'UNAUTHORIZED':
        userMessage = 'Invalid email or password. Please check your credentials.';
        break;
      case 'NETWORK_ERROR':
        userMessage = 'Network error. Please check your connection and try again.';
        break;
      case 'RATE_LIMIT':
        userMessage = 'Too many login attempts. Please wait a moment before trying again.';
        break;
      case 'VALIDATION_ERROR':
        userMessage = 'Please check your input and try again.';
        break;
      default:
        userMessage = this.errorHandler.getUserFriendlyMessage(error);
    }

    this.errorHandler.showErrorNotification(userMessage);

    // Focus on email field for retry
    setTimeout(() => {
      const emailField = document.querySelector('input[formControlName="email"]') as HTMLInputElement;
      if (emailField) {
        emailField.focus();
        emailField.select();
      }
    }, 100);
  }

  /**
   * Focus on the first invalid form field
   */
  private focusFirstInvalidField(): void {
    const firstInvalidField = Object.keys(this.loginForm.controls)
      .find(fieldName => {
        const control = this.loginForm.get(fieldName);
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
   * Demo account login for testing with enhanced feedback
   */
  loginAsDemo(): void {
    this.loginForm.patchValue({
      email: 'demo@example.com',
      password: 'password123',
      rememberMe: true
    });
    
    this.errorHandler.showInfoNotification('Logging in with demo account...');
    
    setTimeout(() => {
      this.onSubmit();
    }, 500);
  }

  /**
   * Admin account login for testing with enhanced feedback
   */
  loginAsAdmin(): void {
    this.loginForm.patchValue({
      email: 'admin@example.com',
      password: 'admin123',
      rememberMe: true
    });
    
    this.errorHandler.showInfoNotification('Logging in with admin account...');
    
    setTimeout(() => {
      this.onSubmit();
    }, 500);
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
    const control = this.loginForm.get(fieldName);
    if (control) {
      control.markAsTouched();
      this.updateFieldValidation(fieldName);
    }
  }

  /**
   * Clear all form errors and reset validation state
   */
  clearErrors(): void {
    this.loginError = null;
    this.submitted = false;
    
    Object.keys(this.validationState).forEach(fieldName => {
      this.validationState[fieldName].showErrors = false;
    });
  }

  /**
   * Reset the form to initial state
   */
  resetForm(): void {
    this.loginForm.reset();
    this.formValidation.resetValidationState(this.loginForm);
    this.clearErrors();
    this.formInteracted = false;
    this.lastSubmitAttempt = null;
  }
} 