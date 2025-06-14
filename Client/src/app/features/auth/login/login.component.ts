import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Login Component
 * 
 * Handles user authentication with email and password.
 * Provides demo login options for testing purposes.
 * Follows Fashion Forward design system and repository patterns.
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
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string = '/';
  hidePassword = true;
  loginError: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    }

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  /**
   * Convenience getter for easy access to form fields
   */
  get f() { 
    return this.loginForm.controls; 
  }

  /**
   * Check if a specific form field has a specific error
   * @param fieldName - The name of the form field
   * @param errorType - The type of error to check for
   * @returns boolean indicating if the field has the specified error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.errors?.[errorType] && (field.dirty || field.touched || this.submitted));
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.submitted = true;
    this.loginError = null;

    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.authService.login({
      email: this.f['email'].value,
      password: this.f['password'].value
    }).subscribe({
      next: () => {
        this.snackBar.open('Welcome back! Login successful.', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate([this.returnUrl]);
      },
      error: error => {
        this.loginError = error.message || 'Invalid email or password. Please try again.';
        this.loading = false;
        this.snackBar.open(this.loginError || 'Login failed', 'Close', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Demo account login for testing
   */
  loginAsDemo(): void {
    this.loginForm.patchValue({
      email: 'demo@example.com',
      password: 'password123',
      rememberMe: true
    });
    this.onSubmit();
  }

  /**
   * Admin account login for testing
   */
  loginAsAdmin(): void {
    this.loginForm.patchValue({
      email: 'admin@example.com',
      password: 'admin123',
      rememberMe: true
    });
    this.onSubmit();
  }

  /**
   * Mark all form fields as touched to trigger validation display
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }
} 