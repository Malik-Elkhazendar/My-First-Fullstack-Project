import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: any;
  };
  message?: string;
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  private readonly DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';
  private readonly NETWORK_ERROR_MESSAGE = 'Network error. Please check your connection.';
  private readonly TIMEOUT_ERROR_MESSAGE = 'Request timeout. Please try again.';

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Handle HTTP errors and convert them to user-friendly messages
   */
  handleHttpError(error: HttpErrorResponse): Observable<never> {
    const appError = this.mapHttpErrorToAppError(error);
    this.logError(appError);
    this.showErrorNotification(appError.message);
    return throwError(() => appError);
  }

  /**
   * Handle general application errors
   */
  handleError(error: any, context?: string): AppError {
    const appError: AppError = {
      code: 'APP_ERROR',
      message: error?.message || this.DEFAULT_ERROR_MESSAGE,
      details: { originalError: error, context },
      timestamp: new Date()
    };

    this.logError(appError);
    return appError;
  }

  /**
   * Show error notification to user
   */
  showErrorNotification(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  /**
   * Show success notification to user
   */
  showSuccessNotification(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  /**
   * Show info notification to user
   */
  showInfoNotification(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  /**
   * Map HTTP errors to application errors
   */
  private mapHttpErrorToAppError(error: HttpErrorResponse): AppError {
    let message: string;
    let code: string;

    // Handle different HTTP error status codes
    switch (error.status) {
      case 0:
        message = this.NETWORK_ERROR_MESSAGE;
        code = 'NETWORK_ERROR';
        break;
      case 400:
        message = this.extractErrorMessage(error) || 'Invalid request. Please check your input.';
        code = 'BAD_REQUEST';
        break;
      case 401:
        message = 'Authentication required. Please log in.';
        code = 'UNAUTHORIZED';
        break;
      case 403:
        message = 'Access denied. You don\'t have permission to perform this action.';
        code = 'FORBIDDEN';
        break;
      case 404:
        message = 'The requested resource was not found.';
        code = 'NOT_FOUND';
        break;
      case 408:
        message = this.TIMEOUT_ERROR_MESSAGE;
        code = 'TIMEOUT';
        break;
      case 409:
        message = this.extractErrorMessage(error) || 'Conflict. The resource already exists.';
        code = 'CONFLICT';
        break;
      case 422:
        message = this.extractErrorMessage(error) || 'Invalid data provided.';
        code = 'VALIDATION_ERROR';
        break;
      case 429:
        message = 'Too many requests. Please try again later.';
        code = 'RATE_LIMIT';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        code = 'SERVER_ERROR';
        break;
      case 502:
      case 503:
      case 504:
        message = 'Service temporarily unavailable. Please try again later.';
        code = 'SERVICE_UNAVAILABLE';
        break;
      default:
        message = this.extractErrorMessage(error) || this.DEFAULT_ERROR_MESSAGE;
        code = 'UNKNOWN_ERROR';
    }

    return {
      code,
      message,
      details: {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        timestamp: new Date()
      },
      timestamp: new Date()
    };
  }

  /**
   * Extract error message from HTTP error response
   */
  private extractErrorMessage(error: HttpErrorResponse): string | null {
    if (error.error) {
      // Handle different API error response formats
      const errorBody = error.error as ApiErrorResponse;
      
      if (typeof errorBody === 'string') {
        return errorBody;
      }

      if (errorBody.error?.message) {
        return errorBody.error.message;
      }

      if (errorBody.message) {
        return errorBody.message;
      }
    }

    return null;
  }

  /**
   * Log error for debugging purposes
   */
  private logError(error: AppError): void {
    console.group(`🚨 Application Error - ${error.code}`);
    console.error('Message:', error.message);
    console.error('Timestamp:', error.timestamp);
    if (error.details) {
      console.error('Details:', error.details);
    }
    console.groupEnd();
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error: AppError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_ERROR',
      'SERVICE_UNAVAILABLE'
    ];
    return retryableCodes.includes(error.code);
  }

  /**
   * Get user-friendly error message for display
   */
  getUserFriendlyMessage(error: AppError): string {
    const friendlyMessages: { [key: string]: string } = {
      'NETWORK_ERROR': 'Please check your internet connection and try again.',
      'TIMEOUT': 'The request is taking longer than expected. Please try again.',
      'UNAUTHORIZED': 'Please log in to continue.',
      'FORBIDDEN': 'You don\'t have permission to access this resource.',
      'NOT_FOUND': 'The requested item could not be found.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'SERVER_ERROR': 'We\'re experiencing technical difficulties. Please try again later.'
    };

    return friendlyMessages[error.code] || error.message || this.DEFAULT_ERROR_MESSAGE;
  }
} 