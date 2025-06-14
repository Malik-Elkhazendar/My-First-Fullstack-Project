import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface OrderCancelDialogData {
  orderNumber: string;
  totalAmount: number;
}

export interface OrderCancelDialogResult {
  reason?: string;
}

@Component({
  selector: 'app-order-cancel-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>Cancel Order</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <p class="confirmation-text">
          Are you sure you want to cancel order <strong>{{ data.orderNumber }}</strong>?
        </p>
        
        <p class="amount-text">
          Order total: <strong>{{ formatCurrency(data.totalAmount) }}</strong>
        </p>
        
        <mat-form-field appearance="outline" class="reason-field">
          <mat-label>Reason for cancellation (optional)</mat-label>
          <textarea 
            matInput 
            [(ngModel)]="cancellationReason"
            placeholder="Please provide a reason for cancelling this order..."
            rows="3">
          </textarea>
        </mat-form-field>
        
        <div class="warning-notice">
          <mat-icon>info</mat-icon>
          <p>This action cannot be undone. You may be charged a cancellation fee depending on the order status.</p>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-button">
          Keep Order
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()" class="confirm-button">
          Cancel Order
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      @apply max-w-md;
    }
    
    .dialog-header {
      @apply flex items-center space-x-3 mb-4;
      
      .warning-icon {
        @apply text-yellow-500 text-2xl;
      }
      
      h2 {
        @apply text-xl font-semibold text-gray-900 m-0;
      }
    }
    
    .dialog-content {
      @apply space-y-4;
      
      .confirmation-text {
        @apply text-gray-700 text-base;
      }
      
      .amount-text {
        @apply text-gray-600 text-sm;
      }
      
      .reason-field {
        @apply w-full;
      }
      
      .warning-notice {
        @apply flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg;
        
        mat-icon {
          @apply text-yellow-600 text-sm mt-0.5 flex-shrink-0;
        }
        
        p {
          @apply text-yellow-800 text-xs m-0;
        }
      }
    }
    
    .dialog-actions {
      @apply flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200;
      
      .cancel-button {
        @apply text-gray-600;
      }
      
      .confirm-button {
        @apply bg-red-600 text-white hover:bg-red-700;
      }
    }
  `]
})
export class OrderCancelConfirmationDialog {
  cancellationReason = '';

  constructor(
    public dialogRef: MatDialogRef<OrderCancelConfirmationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: OrderCancelDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    const result: OrderCancelDialogResult = {
      reason: this.cancellationReason.trim() || undefined
    };
    this.dialogRef.close(result);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
} 