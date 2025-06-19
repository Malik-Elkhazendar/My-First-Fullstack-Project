import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

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
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  hidePassword = true;
  hideConfirmPassword = true;
  registerError: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    }

    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        this.createPasswordStrengthValidator()
      ]],
      confirmPassword: ['', Validators.required],
      agreeTerms: [false, Validators.requiredTrue]
    }, {
      validators: this.createPasswordMatchValidator()
    });
  }

  // Convenience getter for easy access to form fields
  get f() { return this.registerForm.controls; }

  /**
   * Password strength validator
   * Ensures password contains uppercase, lowercase letters and numbers
   */
  private createPasswordStrengthValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]+/.test(value);
      const hasLowerCase = /[a-z]+/.test(value);
      const hasNumeric = /[0-9]+/.test(value);
      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

      return !passwordValid ? { passwordStrength: true } : null;
    }
  }

  /**
   * Password match validator
   * Ensures password and confirm password fields match
   */
  private createPasswordMatchValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      
      return password === confirmPassword ? null : { passwordMismatch: true };
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.submitted = true;
    this.registerError = null;

    // Stop here if form is invalid
    if (this.registerForm.invalid) {
      this.showValidationErrors();
      return;
    }

    this.loading = true;
    
    const formValues = this.registerForm.value;
    this.authService.register({
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      password: formValues.password,
      confirmPassword: formValues.confirmPassword
    }).subscribe({
      next: () => {
        this.showSuccess('Registration successful! Welcome to Fashion Forward!');
        this.router.navigate(['/']);
      },
      error: error => {
        this.registerError = error.message || 'Registration failed. Please try again.';
        this.loading = false;
          this.showError(this.registerError || 'Registration failed. Please try again.');
      }
    });
  }

  /**
   * Check if the form field has errors and was touched or form was submitted
   */
  hasError(controlName: string, errorName: string): boolean {
    const control = this.f[controlName];
    return (control.touched || this.submitted) && control.hasError(errorName);
  }

  /**
   * Check password match error
   */
  hasPasswordMismatch(): boolean {
    return (this.submitted || this.f['confirmPassword'].touched) && 
           this.registerForm.hasError('passwordMismatch');
  }

  /**
   * Show validation errors for better UX
   */
  private showValidationErrors(): void {
    const errors: string[] = [];
    
    if (this.hasError('firstName', 'required')) {
      errors.push('First name is required');
    }
    if (this.hasError('lastName', 'required')) {
      errors.push('Last name is required');
    }
    if (this.hasError('email', 'required')) {
      errors.push('Email is required');
    } else if (this.hasError('email', 'email')) {
      errors.push('Please enter a valid email address');
    }
    if (this.hasError('password', 'required')) {
      errors.push('Password is required');
    } else if (this.hasError('password', 'minlength')) {
      errors.push('Password must be at least 6 characters');
    } else if (this.hasError('password', 'passwordStrength')) {
      errors.push('Password must contain uppercase, lowercase letters and numbers');
    }
    if (this.hasError('confirmPassword', 'required')) {
      errors.push('Confirm password is required');
    } else if (this.hasPasswordMismatch()) {
      errors.push('Passwords do not match');
    }
    if (this.f['agreeTerms'].errors) {
      errors.push('You must agree to the terms to continue');
    }

    if (errors.length > 0) {
      this.showError(`Please fix the following errors: ${errors.join(', ')}`);
    }
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 7000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
} 