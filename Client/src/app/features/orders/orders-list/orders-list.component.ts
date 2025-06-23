import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, startWith, takeWhile } from 'rxjs/operators';

import { OrderService } from '../../../core/services/order.service';
import { ImageService } from '../../../core/services/image.service';
import { CartService } from '../../../core/services/cart.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { 
  Order, 
  OrderStatus, 
  OrderFilters, 
  PaginatedOrderResponse,
  PaymentMethod,
  PaymentStatus
} from '../../../core/models/order.model';

// Quick filter interface
interface QuickFilter {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatPaginatorModule
  ],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Make Math available in template
  Math = Math;
  
  // Type casting helper for template
  $any = (value: any) => value;
  
  // Data properties
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  paginatedOrders: Order[] = [];
  loading$: Observable<boolean>;
  
  // Form properties
  filterForm!: FormGroup;
  filtersForm!: FormGroup; // Alias for template compatibility
  showAdvancedFilters = false;
  
  // Pagination
  totalCount = 0;
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Filter options
  orderStatuses = Object.values(OrderStatus);
  selectedQuickFilter = '';
  expandedOrderId: number | null = null;
  
  // Quick filters configuration
  quickFilters: QuickFilter[] = [
    { label: 'All Orders', value: '', icon: 'all_inclusive' },
    { label: 'Pending', value: 'pending', icon: 'schedule' },
    { label: 'Processing', value: 'processing', icon: 'autorenew' },
    { label: 'Shipped', value: 'shipped', icon: 'local_shipping' },
    { label: 'Delivered', value: 'delivered', icon: 'done_all' },
    { label: 'Cancelled', value: 'cancelled', icon: 'cancel' }
  ];
  
  constructor(
    private orderService: OrderService,
    private imageService: ImageService,
    private cartService: CartService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loading$ = this.orderService.loading$;
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    this.setupFilterSubscription();
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      status: [''],
      dateFrom: [''],
      dateTo: [''],
      minAmount: [''],
      maxAmount: [''],
      searchTerm: [''],
      orderNumber: [''] // Added for new template
    });
    
    // Create alias for template compatibility
    this.filtersForm = this.filterForm;
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value),
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadOrders();
    });
  }

  private loadOrders(): void {
    // Use the OrderService to get orders (which includes newly created ones)
    const filters = this.getFiltersFromForm();
    this.orderService.getOrders(filters, this.currentPage + 1, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedOrderResponse) => {
          this.orders = response.orders;
          this.totalCount = response.totalCount;
          this.applyFiltersAndPagination();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.showError('Failed to load orders. Please try again.');
          this.cdr.markForCheck();
        }
      });
  }

  private getFiltersFromForm(): OrderFilters {
    const formValue = this.filterForm.value;
    const filters: OrderFilters = {};

    if (formValue.status) {
      filters.status = formValue.status;
    }
    if (formValue.searchTerm) {
      filters.searchTerm = formValue.searchTerm;
    }
    if (formValue.dateFrom) {
      filters.dateFrom = formValue.dateFrom;
    }
    if (formValue.dateTo) {
      filters.dateTo = formValue.dateTo;
    }
    if (formValue.minAmount) {
      filters.minAmount = formValue.minAmount;
    }
    if (formValue.maxAmount) {
      filters.maxAmount = formValue.maxAmount;
    }

    return filters;
  }

  private applyFiltersAndPagination(): void {
    // Since filtering and pagination are now handled by the service,
    // we just need to set the display data
    this.filteredOrders = this.orders;
    this.paginatedOrders = this.orders;
    
    this.cdr.markForCheck();
  }

  private matchesFilters(order: Order): boolean {
    const formValue = this.filterForm.value;
    
    // Quick filter (status)
    if (this.selectedQuickFilter && this.selectedQuickFilter !== '') {
      if (order.status.toLowerCase() !== this.selectedQuickFilter.toLowerCase()) {
        return false;
      }
    }
    
    // Order number filter
    if (formValue.orderNumber && formValue.orderNumber.trim()) {
      if (!order.orderNumber.toLowerCase().includes(formValue.orderNumber.toLowerCase())) {
        return false;
      }
    }
    
    // Date filters
    if (formValue.dateFrom) {
      const fromDate = new Date(formValue.dateFrom);
      const orderDate = new Date(order.createdAt);
      if (orderDate < fromDate) {
        return false;
      }
    }
    
    if (formValue.dateTo) {
      const toDate = new Date(formValue.dateTo);
      const orderDate = new Date(order.createdAt);
      if (orderDate > toDate) {
        return false;
      }
    }
    
    return true;
  }

  // Template methods
  onQuickFilterChange(value: string): void {
    this.selectedQuickFilter = value;
    this.filterForm.patchValue({ status: value || '' });
    this.currentPage = 0;
    this.loadOrders();
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadOrders();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.selectedQuickFilter = '';
    this.currentPage = 0;
    this.loadOrders();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadOrders();
  }

  // Order expansion methods
  onOrderExpanded(orderId: number): void {
    this.expandedOrderId = orderId;
  }

  onOrderCollapsed(): void {
    this.expandedOrderId = null;
  }

  // Order action methods
  viewOrderDetails(orderId: number): void {
    this.router.navigate(['/orders/details', orderId]);
  }

  trackPackage(trackingNumber: string): void {
    this.showInfo(`Tracking Number: ${trackingNumber}`);
    // In a real app, this would open a tracking dialog or navigate to tracking page
  }

  reorderItems(orderId: number): void {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      // Add all items from the order to cart
      order.items.forEach(item => {
        this.cartService.addToCart(item.product, item.quantity);
      });
      
      this.showSuccess(`${order.items.length} items added to cart from order ${order.orderNumber}`);
    }
  }

  cancelOrder(orderId: number): void {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      const dialogData: ConfirmationDialogData = {
        title: 'Cancel Order',
        message: `Are you sure you want to cancel order ${order.orderNumber}?`,
        details: 'This action cannot be undone and you may be charged a cancellation fee.',
        type: 'warning',
        confirmText: 'Cancel Order',
        cancelText: 'Keep Order',
        icon: 'cancel'
      };
      
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: dialogData,
        width: '400px',
        disableClose: true
      });

      dialogRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          // Update order status
          order.status = OrderStatus.Cancelled;
          this.showSuccess('Order cancelled successfully');
          this.applyFiltersAndPagination();
        }
      });
    }
  }

  // Utility methods
  canReorder(status: string): boolean {
    return ['delivered', 'cancelled'].includes(status.toLowerCase());
  }

  canCancel(status: string): boolean {
    return ['pending', 'confirmed', 'processing'].includes(status.toLowerCase());
  }

  onImageError(event: Event): void {
    this.imageService.handleImageError(event);
  }

  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      'pending': 'schedule',
      'confirmed': 'check_circle',
      'processing': 'autorenew',
      'shipped': 'local_shipping',
      'delivered': 'done_all',
      'cancelled': 'cancel',
      'refunded': 'undo',
      'failed': 'error'
    };
    return iconMap[status.toLowerCase()] || 'help';
  }

  trackByOrderId(index: number, order: Order): number {
    return order.id || index;
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // Legacy methods for compatibility
  getStatusDisplay(status: OrderStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getStatusColor(status: OrderStatus): string {
    const colorMap: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: '#f59e0b',
      [OrderStatus.Confirmed]: '#06b6d4',
      [OrderStatus.Processing]: '#8b5cf6',
      [OrderStatus.Shipped]: '#3b82f6',
      [OrderStatus.Delivered]: '#10b981',
      [OrderStatus.Cancelled]: '#ef4444',
      [OrderStatus.Refunded]: '#6b7280',
      [OrderStatus.Failed]: '#ef4444'
    };
    return colorMap[status] || '#6b7280';
  }

  formatOrderNumber(orderNumber: string): string {
    return orderNumber;
  }

  canCancelOrder(order: Order): boolean {
    return this.canCancel(order.status);
  }

  onCancelOrder(order: Order): void {
    if (order.id) {
      this.cancelOrder(order.id);
    }
  }

  onViewOrderDetails(order: Order): void {
    if (order.id) {
      this.viewOrderDetails(order.id);
    }
  }

  onTrackOrder(order: Order): void {
    if (order.trackingNumber) {
      this.trackPackage(order.trackingNumber);
    }
  }

  onReorderItems(order: Order): void {
    if (order.id) {
      this.reorderItems(order.id);
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }

  // Additional utility methods
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getOrderItemsCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  onQuickFilter(field: string, value: any): void {
    this.filterForm.patchValue({ [field]: value });
    this.currentPage = 0;
    this.loadOrders();
  }

  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return Object.values(formValue).some(value => value !== '' && value !== null) || this.selectedQuickFilter !== '';
  }

  getProductImageUrl(path: string): string {
    return this.imageService.getImageUrl(path);
  }

  handleImageError(event: Event): void {
    this.imageService.handleImageError(event);
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  // Helper methods for safe property access
  getOrderProductImageUrl(order: Order): string {
    return this.getProductImageUrl(order.items[0]?.product?.imageUrl || '');
  }

  getOrderProductName(order: Order): string {
    return order.items[0]?.product?.name || 'Urban Threads Order';
  }

  getOrderProductImageAlt(order: Order): string {
    return `Image for ${order.items[0]?.product?.name || 'order item'}`;
  }
} 


