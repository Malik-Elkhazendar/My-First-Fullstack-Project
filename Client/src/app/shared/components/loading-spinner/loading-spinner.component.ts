import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div 
      class="loading-container"
      [class.overlay]="overlay"
      [class.inline]="!overlay"
      [attr.aria-label]="loadingText"
      role="status"
    >
      <div class="loading-content">
        <mat-progress-spinner
          [diameter]="diameter"
          [strokeWidth]="strokeWidth"
          [mode]="mode"
          [value]="value"
          [color]="color">
        </mat-progress-spinner>
        
        <div 
          *ngIf="loadingText" 
          class="loading-text"
          [style.font-size.px]="textSize"
        >
          {{ loadingText }}
        </div>
        
        <div 
          *ngIf="description" 
          class="loading-description"
        >
          {{ description }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      
      &.overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(2px);
        z-index: 9999;
        
        .loading-content {
          background: white;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
      }
      
      &.inline {
        padding: 24px;
        
        .loading-content {
          padding: 0;
        }
      }
    }
    
    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    
    .loading-text {
      font-weight: 500;
      color: #666;
      text-align: center;
      margin-top: 8px;
    }
    
    .loading-description {
      font-size: 14px;
      color: #888;
      text-align: center;
      max-width: 300px;
      line-height: 1.4;
    }
    
    @media (max-width: 768px) {
      .loading-container.overlay .loading-content {
        padding: 24px;
        margin: 16px;
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() overlay = false;
  @Input() loadingText = '';
  @Input() description = '';
  @Input() diameter = 50;
  @Input() strokeWidth = 4;
  @Input() textSize = 16;
  @Input() mode: 'determinate' | 'indeterminate' = 'indeterminate';
  @Input() value = 0;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
} 