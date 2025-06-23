import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

export interface ErrorDisplayConfig {
  type: 'network' | 'not-found' | 'server' | 'validation' | 'unknown';
  title?: string;
  message?: string;
  showRetryButton?: boolean;
  showHomeButton?: boolean;
  customActions?: Array<{
    label: string;
    action: string;
    color?: 'primary' | 'accent' | 'warn';
  }>;
}

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterModule],
  template: `
    <div class="error-display-container" [class]="'error-type-' + config.type">
      <div class="error-content">
        <mat-icon class="error-icon">{{ getErrorIcon() }}</mat-icon>
        <h2 class="error-title">{{ config.title || getDefaultTitle() }}</h2>
        <p class="error-message">{{ config.message || getDefaultMessage() }}</p>
        
        <div class="error-actions" *ngIf="hasActions()">
          <button 
            *ngIf="config.showRetryButton"
            mat-raised-button 
            color="primary"
            (click)="onRetry()"
            class="action-button">
            <mat-icon>refresh</mat-icon>
            Try Again
          </button>
          
          <button 
            *ngIf="config.showHomeButton"
            mat-stroked-button
            routerLink="/"
            class="action-button">
            <mat-icon>home</mat-icon>
            Go Home
          </button>
          
          <button 
            *ngFor="let action of config.customActions"
            mat-button
            [color]="action.color || 'primary'"
            (click)="onCustomAction(action.action)"
            class="action-button">
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-display-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      padding: 2rem;
      text-align: center;
    }

    .error-content {
      max-width: 500px;
    }

    .error-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 1rem;
      color: #ef4444;
    }

    .error-type-network .error-icon { color: #f59e0b; }
    .error-type-not-found .error-icon { color: #6b7280; }
    .error-type-server .error-icon { color: #ef4444; }
    .error-type-validation .error-icon { color: #f59e0b; }

    .error-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #1f2937;
    }

    .error-message {
      color: #6b7280;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .action-button {
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .error-actions {
        flex-direction: column;
        align-items: center;
      }
      
      .action-button {
        width: 100%;
        max-width: 200px;
      }
    }
  `]
})
export class ErrorDisplayComponent {
  @Input() config: ErrorDisplayConfig = { type: 'unknown' };
  @Output() retry = new EventEmitter<void>();
  @Output() customAction = new EventEmitter<string>();

  getErrorIcon(): string {
    const icons = {
      network: 'wifi_off',
      'not-found': 'search_off',
      server: 'error_outline',
      validation: 'warning',
      unknown: 'help_outline'
    };
    return icons[this.config.type] || icons.unknown;
  }

  getDefaultTitle(): string {
    const titles = {
      network: 'Connection Problem',
      'not-found': 'Not Found',
      server: 'Server Error',
      validation: 'Invalid Data',
      unknown: 'Something Went Wrong'
    };
    return titles[this.config.type] || titles.unknown;
  }

  getDefaultMessage(): string {
    const messages = {
      network: 'Please check your internet connection and try again.',
      'not-found': 'The page or resource you\'re looking for doesn\'t exist.',
      server: 'We\'re experiencing technical difficulties. Please try again later.',
      validation: 'Please check your input and try again.',
      unknown: 'An unexpected error occurred. Please try again.'
    };
    return messages[this.config.type] || messages.unknown;
  }

  hasActions(): boolean {
    return !!(this.config.showRetryButton || this.config.showHomeButton || this.config.customActions?.length);
  }

  onRetry(): void {
    this.retry.emit();
  }

  onCustomAction(action: string): void {
    this.customAction.emit(action);
  }
} 