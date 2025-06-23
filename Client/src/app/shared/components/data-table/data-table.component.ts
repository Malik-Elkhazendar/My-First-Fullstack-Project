import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Column configuration interface
 */
export interface TableColumn<T = any> {
  /** Column key/property name */
  key: keyof T;
  /** Display header text */
  header: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Column width (CSS value) */
  width?: string;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether column is sticky */
  sticky?: boolean;
  /** Custom cell template name */
  cellTemplate?: string;
  /** Custom header template name */
  headerTemplate?: string;
  /** Whether column is hidden */
  hidden?: boolean;
  /** Column type for default formatting */
  type?: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'actions';
}

/**
 * Table action interface
 */
export interface TableAction<T = any> {
  /** Action identifier */
  id: string;
  /** Action label */
  label: string;
  /** Action icon */
  icon?: string;
  /** Action color */
  color?: 'primary' | 'accent' | 'warn';
  /** Whether action is disabled for specific row */
  disabled?: (row: T) => boolean;
  /** Whether action is visible for specific row */
  visible?: (row: T) => boolean;
  /** Action tooltip */
  tooltip?: string;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Current page index (0-based) */
  pageIndex: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Whether to show first/last buttons */
  showFirstLastButtons?: boolean;
}

/**
 * Reusable data table component with sorting, pagination, and actions
 * 
 * @example
 * ```html
 * <app-data-table
 *   [data]="products"
 *   [columns]="columns"
 *   [actions]="actions"
 *   [pagination]="paginationConfig"
 *   [selectable]="true"
 *   [loading]="loading"
 *   (actionClick)="onActionClick($event)"
 *   (sortChange)="onSortChange($event)"
 *   (pageChange)="onPageChange($event)"
 *   (selectionChange)="onSelectionChange($event)">
 *   
 *   <ng-template #nameCell let-row="row">
 *     <strong>{{ row.name }}</strong>
 *   </ng-template>
 * </app-data-table>
 * ```
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="data-table-container">
      <!-- Loading overlay -->
      <div *ngIf="loading" class="data-table__loading">
        <mat-icon>refresh</mat-icon>
        <span>Loading...</span>
      </div>

      <!-- Table -->
      <table 
        mat-table 
        [dataSource]="data" 
        matSort
        (matSortChange)="onSortChange($event)"
        class="data-table"
        [class.data-table--loading]="loading"
      >
        <!-- Selection column -->
        <ng-container matColumnDef="select" *ngIf="selectable">
          <th mat-header-cell *matHeaderCellDef class="data-table__select-header">
            <mat-checkbox
              (change)="toggleAllRows($event)"
              [checked]="isAllSelected()"
              [indeterminate]="isPartiallySelected()"
              [attr.aria-label]="'Select all'"
            ></mat-checkbox>
          </th>
          <td mat-cell *matCellDef="let row" class="data-table__select-cell">
            <mat-checkbox
              (click)="$event.stopPropagation()"
              (change)="toggleRow(row, $event)"
              [checked]="isSelected(row)"
              [attr.aria-label]="'Select row'"
            ></mat-checkbox>
          </td>
        </ng-container>

        <!-- Dynamic columns -->
        <ng-container 
          *ngFor="let column of visibleColumns" 
          [matColumnDef]="column.key.toString()"
        >
          <!-- Header -->
          <th 
            mat-header-cell 
            *matHeaderCellDef
            [mat-sort-header]="column.sortable && column.key ? column.key.toString() : ''"
            [style.width]="column.width"
            [style.text-align]="column.align || 'left'"
            [class.mat-column-sticky]="column.sticky"
            class="data-table__header"
          >
            {{ column.header }}
          </th>

          <!-- Cell -->
          <td 
            mat-cell 
            *matCellDef="let row" 
            [style.text-align]="column.align || 'left'"
            [class.mat-column-sticky]="column.sticky"
            class="data-table__cell"
          >
            <!-- Custom template -->
            <ng-container *ngIf="hasTemplate(column.cellTemplate); else defaultCell">
              <ng-container 
                *ngTemplateOutlet="getTemplate(column.cellTemplate); context: { row: row, column: column, value: getValue(row, column.key) }"
              ></ng-container>
            </ng-container>

            <!-- Default cell content -->
            <ng-template #defaultCell>
              <span [innerHTML]="formatCellValue(row, column)"></span>
            </ng-template>
          </td>
        </ng-container>

        <!-- Actions column -->
        <ng-container matColumnDef="actions" *ngIf="actions && actions.length > 0">
          <th mat-header-cell *matHeaderCellDef class="data-table__actions-header">
            Actions
          </th>
          <td mat-cell *matCellDef="let row" class="data-table__actions-cell">
            <button
              *ngFor="let action of getVisibleActions(row)"
              mat-icon-button
              [color]="action.color"
              [disabled]="isActionDisabled(action, row)"
              [matTooltip]="action.tooltip || action.label"
              (click)="onActionClick(action, row, $event)"
              [attr.aria-label]="action.label"
            >
              <mat-icon>{{ action.icon || 'more_vert' }}</mat-icon>
            </button>
          </td>
        </ng-container>

        <!-- Header row -->
        <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: stickyHeader"></tr>
        
        <!-- Data rows -->
        <tr 
          mat-row 
          *matRowDef="let row; columns: displayedColumns;"
          [class.data-table__row--selected]="isSelected(row)"
          (click)="onRowClick(row)"
        ></tr>

        <!-- No data row -->
        <tr class="data-table__no-data" *matNoDataRow>
          <td [attr.colspan]="displayedColumns.length" class="data-table__no-data-cell">
            <div class="data-table__no-data-content">
              <mat-icon>inbox</mat-icon>
              <span>{{ noDataMessage || 'No data available' }}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Pagination -->
      <mat-paginator
        *ngIf="pagination"
        [length]="pagination.totalItems"
        [pageSize]="pagination.pageSize"
        [pageIndex]="pagination.pageIndex"
        [pageSizeOptions]="pagination.pageSizeOptions || [5, 10, 25, 50, 100]"
        [showFirstLastButtons]="pagination.showFirstLastButtons !== false"
        (page)="onPageChange($event)"
        class="data-table__paginator"
      ></mat-paginator>
    </div>
  `,
  styles: [`
    .data-table-container {
      position: relative;
      width: 100%;
      overflow: auto;
    }

    .data-table__loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      z-index: 10;
      
      mat-icon {
        animation: spin 1s linear infinite;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      
      span {
        font-size: 14px;
        color: #666;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .data-table {
      width: 100%;
      
      &--loading {
        opacity: 0.6;
        pointer-events: none;
      }
    }

    .data-table__header {
      font-weight: 600;
      color: #374151;
      background-color: #f9fafb;
    }

    .data-table__cell {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table__select-header,
    .data-table__select-cell {
      width: 48px;
      padding: 8px 12px;
    }

    .data-table__actions-header,
    .data-table__actions-cell {
      width: auto;
      padding: 8px 16px;
    }

    .data-table__actions-cell {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
    }

    .data-table__row--selected {
      background-color: #f0f9ff;
    }

    .data-table__no-data {
      height: 200px;
    }

    .data-table__no-data-cell {
      text-align: center;
      padding: 40px 16px;
    }

    .data-table__no-data-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: #6b7280;
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
      }
      
      span {
        font-size: 16px;
      }
    }

    .data-table__paginator {
      border-top: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .data-table__cell,
      .data-table__header {
        padding: 8px 12px;
        font-size: 14px;
      }
      
      .data-table__actions-cell {
        padding: 4px 8px;
      }
    }
  `]
})
export class DataTableComponent<T = any> implements OnChanges {
  /** Table data */
  @Input() data: T[] = [];
  
  /** Column definitions */
  @Input() columns: TableColumn<T>[] = [];
  
  /** Available actions */
  @Input() actions?: TableAction<T>[];
  
  /** Pagination configuration */
  @Input() pagination?: PaginationConfig;
  
  /** Whether rows are selectable */
  @Input() selectable = false;
  
  /** Loading state */
  @Input() loading = false;
  
  /** Sticky header */
  @Input() stickyHeader = false;
  
  /** No data message */
  @Input() noDataMessage?: string;
  
  /** Track by function */
  @Input() trackByFn?: (index: number, item: T) => any;

  /** Action click event */
  @Output() actionClick = new EventEmitter<{ action: TableAction<T>; row: T; event: Event }>();
  
  /** Sort change event */
  @Output() sortChange = new EventEmitter<Sort>();
  
  /** Page change event */
  @Output() pageChange = new EventEmitter<PageEvent>();
  
  /** Selection change event */
  @Output() selectionChange = new EventEmitter<T[]>();
  
  /** Row click event */
  @Output() rowClick = new EventEmitter<T>();

  /** Content child templates */
  @ContentChild('nameCell') nameCellTemplate?: TemplateRef<any>;
  @ContentChild('priceCell') priceCellTemplate?: TemplateRef<any>;
  @ContentChild('statusCell') statusCellTemplate?: TemplateRef<any>;
  @ContentChild('dateCell') dateCellTemplate?: TemplateRef<any>;
  @ContentChild('imageCell') imageCellTemplate?: TemplateRef<any>;

  /** Internal state */
  selectedRows = new Set<T>();
  displayedColumns: string[] = [];
  visibleColumns: TableColumn<T>[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.updateDisplayedColumns();
    }
  }

  /**
   * Update displayed columns based on configuration
   */
  private updateDisplayedColumns(): void {
    this.visibleColumns = this.columns.filter(col => !col.hidden);
    
    this.displayedColumns = [];
    
    if (this.selectable) {
      this.displayedColumns.push('select');
    }
    
    this.displayedColumns.push(...this.visibleColumns.map(col => col.key.toString()));
    
    if (this.actions && this.actions.length > 0) {
      this.displayedColumns.push('actions');
    }
  }

  /**
   * Get cell value from row
   */
  getValue(row: T, key: keyof T): any {
    return row[key];
  }

  /**
   * Format cell value based on column type
   */
  formatCellValue(row: T, column: TableColumn<T>): string {
    const value = this.getValue(row, column.key);
    
    if (value == null) return '';
    
    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(value));
      
      case 'number':
        return Number(value).toLocaleString();
      
      case 'date':
        return new Date(value).toLocaleDateString();
      
      case 'boolean':
        return value ? 'Yes' : 'No';
      
      default:
        return String(value);
    }
  }

  /**
   * Check if template exists
   */
  hasTemplate(templateName?: string): boolean {
    if (!templateName) return false;
    return !!(this as any)[templateName + 'Template'];
  }

  /**
   * Get template reference
   */
  getTemplate(templateName?: string): TemplateRef<any> | null {
    if (!templateName) return null;
    return (this as any)[templateName + 'Template'] || null;
  }

  /**
   * Handle sort change
   */
  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  /**
   * Handle action click
   */
  onActionClick(action: TableAction<T>, row: T, event: Event): void {
    event.stopPropagation();
    this.actionClick.emit({ action, row, event });
  }

  /**
   * Handle row click
   */
  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  /**
   * Get visible actions for a row
   */
  getVisibleActions(row: T): TableAction<T>[] {
    if (!this.actions) return [];
    return this.actions.filter(action => 
      !action.visible || action.visible(row)
    );
  }

  /**
   * Check if action is disabled for a row
   */
  isActionDisabled(action: TableAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  /**
   * Selection methods
   */
  isSelected(row: T): boolean {
    return this.selectedRows.has(row);
  }

  toggleRow(row: T, event: any): void {
    if (event.checked) {
      this.selectedRows.add(row);
    } else {
      this.selectedRows.delete(row);
    }
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  toggleAllRows(event: any): void {
    if (event.checked) {
      this.data.forEach(row => this.selectedRows.add(row));
    } else {
      this.selectedRows.clear();
    }
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  isAllSelected(): boolean {
    return this.data.length > 0 && this.selectedRows.size === this.data.length;
  }

  isPartiallySelected(): boolean {
    return this.selectedRows.size > 0 && this.selectedRows.size < this.data.length;
  }
} 