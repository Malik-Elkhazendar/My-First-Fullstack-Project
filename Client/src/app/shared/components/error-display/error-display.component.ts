import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AppError } from '../../../core/services/error-handling.service';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div 
      class="error-container"
      [class.compact]="compact"
      [class.inline]="inline"
      role="alert"
      [attr.aria-label]="'Error: ' + displayMessage"
    >
      <mat-card class="error-card">
        <div class="error-content">
          <mat-icon 
            class="error-icon"
            [style.font-size.px]="iconSize"
          >
            {{ getErrorIcon() }}
          </mat-icon>
          
          <div class="error-details">
            <h3 class="error-title" *ngIf="!compact">
              {{ getErrorTitle() }}
            </h3>
            
            <p class="error-message">
              {{ displayMessage }}
            </p>
            
            <div 
              *ngIf="showDetails && error?.details" 
              class="error-additional-details"
            >
              <details>
                <summary>Technical Details</summary>
                <pre>{{ error.details | json }}</pre>
              </details>
            </div>
          </div>
        </div>
        
        <div class="error-actions" *ngIf="showActions">
          <button 
            mat-raised-button 
            color="primary"
            *ngIf="retryable"
            (click)="onRetry()"
            [disabled]="retrying"
            aria-label="Retry the failed operation"
          >
            <mat-icon *ngIf="retrying">refresh</mat-icon>
            <span>{{ retrying ? 'Retrying...' : 'Try Again' }}</span>
          </button>
          
          <button 
            mat-stroked-button
            *ngIf="showHome"
            (click)="onGoHome()"
            aria-label="Go to home page"
          >
            <mat-icon>home</mat-icon>
            <span>Go Home</span>
          </button>
          
          <button 
            mat-stroked-button
            *ngIf="showSupport"
            (click)="onContactSupport()"
            aria-label="Contact customer support"
          >
            <mat-icon>support</mat-icon>
            <span>Contact Support</span>
          </button>
          
          <button 
            mat-button
            *ngIf="dismissible"
            (click)="onDismiss()"
            aria-label="Dismiss this error"
          >
            <mat-icon>close</mat-icon>
            <span>Dismiss</span>
          </button>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
      min-height: 200px;
      
      &.compact {
        padding: 12px;
        min-height: auto;
      }
      
      &.inline {
        min-height: auto;
      }
    }
    
    .error-card {
      max-width: 600px;
      width: 100%;
      background: #fff;
      border-left: 4px solid #f44336;
    }
    
    .error-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .error-icon {
      color: #f44336;
      margin-top: 4px;
      font-size: 32px !important;
      height: 32px !important;
      width: 32px !important;
    }
    
    .error-details {
      flex: 1;
    }
    
    .error-title {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }
    
    .error-message {
      margin: 0 0 12px 0;
      color: #666;
      line-height: 1.5;
      font-size: 16px;
    }
    
    .error-additional-details {
      margin-top: 16px;
      
      details {
        cursor: pointer;
        
        summary {
          font-weight: 500;
          color: #666;
          padding: 8px 0;
          outline: none;
          
          &:hover {
            color: #333;
          }
        }
        
        pre {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          font-size: 12px;
          overflow-x: auto;
          margin-top: 8px;
          color: #333;
        }
      }
    }
    
    .error-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: flex-start;
      
      button {
        min-width: 120px;
        
        mat-icon {
          margin-right: 8px;
          font-size: 20px;
          
          &.mat-icon {
            height: 20px;
            width: 20px;
          }
        }
      }
    }
    
    .compact {
      .error-container {
        padding: 8px;
      }
      
      .error-content {
        margin-bottom: 12px;
      }
      
      .error-icon {
        font-size: 24px !important;
        height: 24px !important;
        width: 24px !important;
      }
      
      .error-message {
        font-size: 14px;
      }
      
      .error-actions button {
        min-width: 100px;
        
        mat-icon {
          font-size: 18px;
          height: 18px;
          width: 18px;
        }
      }
    }
    
    @media (max-width: 768px) {
      .error-container {
        padding: 16px;
      }
      
      .error-content {
        flex-direction: column;
        text-align: center;
      }
      
      .error-actions {
        justify-content: center;
        
        button {
          flex: 1;
          min-width: auto;
        }
      }
    }
  `]
})
export class ErrorDisplayComponent {
  @Input() error: AppError | null = null;
  @Input() message = '';
  @Input() retryable = false;
  @Input() retrying = false;
  @Input() compact = false;
  @Input() inline = false;
  @Input() showActions = true;
  @Input() showHome = false;
  @Input() showSupport = false;
  @Input() showDetails = false;
  @Input() dismissible = false;
  @Input() iconSize = 32;

  @Output() retry = new EventEmitter<void>();
  @Output() goHome = new EventEmitter<void>();
  @Output() contactSupport = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  get displayMessage(): string {
    if (this.message) {
      return this.message;
    }
    
    if (this.error) {
      return this.error.message || 'An unexpected error occurred';
    }
    
    return 'Something went wrong. Please try again.';
  }

  getErrorIcon(): string {
    if (this.error?.code) {
      switch (this.error.code) {
        case 'NETWORK_ERROR':
          return 'wifi_off';
        case 'TIMEOUT':
          return 'schedule';
        case 'UNAUTHORIZED':
          return 'lock';
        case 'FORBIDDEN':
          return 'block';
        case 'NOT_FOUND':
          return 'search_off';
        case 'SERVER_ERROR':
          return 'dns';
        case 'VALIDATION_ERROR':
          return 'error_outline';
        default:
          return 'error';
      }
    }
    return 'error';
  }

  getErrorTitle(): string {
    if (this.error?.code) {
      switch (this.error.code) {
        case 'NETWORK_ERROR':
          return 'Connection Problem';
        case 'TIMEOUT':
          return 'Request Timeout';
        case 'UNAUTHORIZED':
          return 'Authentication Required';
        case 'FORBIDDEN':
          return 'Access Denied';
        case 'NOT_FOUND':
          return 'Not Found';
        case 'SERVER_ERROR':
          return 'Server Error';
        case 'VALIDATION_ERROR':
          return 'Invalid Data';
        default:
          return 'Error';
      }
    }
    return 'Something Went Wrong';
  }

  onRetry(): void {
    this.retry.emit();
  }

  onGoHome(): void {
    this.goHome.emit();
  }

  onContactSupport(): void {
    this.contactSupport.emit();
  }

  onDismiss(): void {
    this.dismiss.emit();
  }
} 