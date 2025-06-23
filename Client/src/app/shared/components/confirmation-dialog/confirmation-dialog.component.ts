import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Configuration interface for the confirmation dialog
 */
export interface ConfirmationDialogData {
  /** Dialog title */
  title: string;
  /** Dialog message/content */
  message: string;
  /** Confirm button text (default: 'Confirm') */
  confirmText?: string;
  /** Cancel button text (default: 'Cancel') */
  cancelText?: string;
  /** Dialog type for styling (default: 'warning') */
  type?: 'warning' | 'danger' | 'info' | 'success';
  /** Icon to display (optional) */
  icon?: string;
  /** Whether to show the icon (default: true) */
  showIcon?: boolean;
  /** Additional details text (optional) */
  details?: string;
}

/**
 * Reusable confirmation dialog component
 * 
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
 *   data: {
 *     title: 'Delete Product',
 *     message: 'Are you sure you want to delete this product?',
 *     details: 'This action cannot be undone.',
 *     type: 'danger',
 *     confirmText: 'Delete',
 *     cancelText: 'Cancel'
 *   }
 * });
 * 
 * dialogRef.afterClosed().subscribe(result => {
 *   if (result) {
 *     // User confirmed
 *   }
 * });
 * ```
 */
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirmation-dialog" [class]="'confirmation-dialog--' + data.type">
      <!-- Header -->
      <div class="confirmation-dialog__header">
        <div class="confirmation-dialog__icon" *ngIf="data.showIcon !== false">
          <mat-icon 
            [class]="'icon--' + data.type"
            [attr.aria-hidden]="true"
          >
            {{ getIcon() }}
          </mat-icon>
        </div>
        <h2 
          class="confirmation-dialog__title"
          id="dialog-title"
        >
          {{ data.title }}
        </h2>
      </div>

      <!-- Content -->
      <div 
        class="confirmation-dialog__content"
        [attr.aria-labelledby]="'dialog-title'"
      >
        <p class="confirmation-dialog__message">
          {{ data.message }}
        </p>
        <p 
          *ngIf="data.details" 
          class="confirmation-dialog__details"
        >
          {{ data.details }}
        </p>
      </div>

      <!-- Actions -->
      <div class="confirmation-dialog__actions">
        <button
          mat-button
          type="button"
          class="confirmation-dialog__cancel"
          (click)="onCancel()"
          [attr.aria-label]="data.cancelText || 'Cancel'"
        >
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button
          mat-raised-button
          type="button"
          [class]="'confirmation-dialog__confirm confirmation-dialog__confirm--' + data.type"
          (click)="onConfirm()"
          [attr.aria-label]="data.confirmText || 'Confirm'"
        >
          {{ data.confirmText || 'Confirm' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      padding: 24px;
      min-width: 400px;
      max-width: 500px;
      
      @media (max-width: 480px) {
        min-width: 280px;
        padding: 20px;
      }
    }

    .confirmation-dialog__header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .confirmation-dialog__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      flex-shrink: 0;
      
      .icon--warning {
        color: #f59e0b;
        background-color: #fef3c7;
      }
      
      .icon--danger {
        color: #ef4444;
        background-color: #fee2e2;
      }
      
      .icon--info {
        color: #3b82f6;
        background-color: #dbeafe;
      }
      
      .icon--success {
        color: #10b981;
        background-color: #d1fae5;
      }
    }

    .confirmation-dialog__title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      line-height: 1.4;
    }

    .confirmation-dialog__content {
      margin-bottom: 24px;
    }

    .confirmation-dialog__message {
      margin: 0 0 12px 0;
      font-size: 1rem;
      color: #374151;
      line-height: 1.5;
    }

    .confirmation-dialog__details {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.4;
    }

    .confirmation-dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      
      @media (max-width: 480px) {
        flex-direction: column-reverse;
        gap: 8px;
      }
    }

    .confirmation-dialog__cancel {
      color: #6b7280;
      
      &:hover {
        background-color: #f9fafb;
        color: #374151;
      }
    }

    .confirmation-dialog__confirm {
      &--warning {
        background-color: #f59e0b;
        color: white;
        
        &:hover {
          background-color: #d97706;
        }
      }
      
      &--danger {
        background-color: #ef4444;
        color: white;
        
        &:hover {
          background-color: #dc2626;
        }
      }
      
      &--info {
        background-color: #3b82f6;
        color: white;
        
        &:hover {
          background-color: #2563eb;
        }
      }
      
      &--success {
        background-color: #10b981;
        color: white;
        
        &:hover {
          background-color: #059669;
        }
      }
    }

    @media (max-width: 480px) {
      .confirmation-dialog__actions button {
        width: 100%;
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {
    // Set default values
    this.data = {
      type: 'warning',
      showIcon: true,
      ...data
    };
  }

  /**
   * Get the appropriate icon based on dialog type
   */
  getIcon(): string {
    if (this.data.icon) {
      return this.data.icon;
    }

    const iconMap: Record<string, string> = {
      warning: 'warning',
      danger: 'error',
      info: 'info',
      success: 'check_circle'
    };

    return iconMap[this.data.type || 'warning'] || 'help';
  }

  /**
   * Handle cancel button click
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Handle confirm button click
   */
  onConfirm(): void {
    this.dialogRef.close(true);
  }
} 