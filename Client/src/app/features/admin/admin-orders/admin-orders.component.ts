import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { AdminService } from '../../../core/services/admin.service';
import { RecentOrder, OrderStatus } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.scss']
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  orders: RecentOrder[] = [];
  filteredOrders: RecentOrder[] = [];
  searchTerm = '';
  selectedStatus = '';
  startDate = '';
  endDate = '';
  orderStatuses = Object.values(OrderStatus);
  loading = false;
  
  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    // Load orders
    this.adminService.getRecentOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe(orders => {
        this.orders = orders;
        this.filteredOrders = orders;
      });

    // Subscribe to loading state
    this.adminService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onDateRangeChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredOrders = this.orders.filter(order => {
      const matchesSearch = !this.searchTerm || 
        order.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.selectedStatus || 
        order.status === this.selectedStatus;
      
      const matchesDateRange = this.isWithinDateRange(order.date);
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }

  private isWithinDateRange(orderDate: string): boolean {
    if (!this.startDate && !this.endDate) return true;
    
    const orderDateObj = new Date(orderDate);
    const startDateObj = this.startDate ? new Date(this.startDate) : null;
    const endDateObj = this.endDate ? new Date(this.endDate) : null;
    
    if (startDateObj && orderDateObj < startDateObj) return false;
    if (endDateObj && orderDateObj > endDateObj) return false;
    
    return true;
  }

  // Enhanced UI Methods
  getCustomerInitials(customerName: string): string {
    return customerName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getStatusBadgeClass(status: OrderStatus): string {
    const statusClasses = {
      [OrderStatus.Pending]: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      [OrderStatus.Processing]: 'bg-blue-100 text-blue-800 border border-blue-200',
      [OrderStatus.Shipped]: 'bg-orange-100 text-orange-800 border border-orange-200',
      [OrderStatus.Delivered]: 'bg-green-100 text-green-800 border border-green-200',
      [OrderStatus.Cancelled]: 'bg-red-100 text-red-800 border border-red-200'
    };
    return statusClasses[status] || statusClasses[OrderStatus.Pending];
  }

  getStatusEmoji(status: OrderStatus): string {
    const statusEmojis = {
      [OrderStatus.Pending]: '🟡',
      [OrderStatus.Processing]: '🔵',
      [OrderStatus.Shipped]: '🟠',
      [OrderStatus.Delivered]: '🟢',
      [OrderStatus.Cancelled]: '🔴'
    };
    return statusEmojis[status] || '🟡';
  }

  getPendingCount(): number {
    return this.filteredOrders.filter(order => order.status === OrderStatus.Pending).length;
  }

  getProcessingCount(): number {
    return this.filteredOrders.filter(order => order.status === OrderStatus.Processing).length;
  }

  onViewOrder(order: RecentOrder): void {
    // TODO: Implement view order functionality
    console.log('View order:', order);
  }

  onUpdateStatus(order: RecentOrder, newStatus: OrderStatus): void {
    // TODO: Implement update status functionality
    console.log('Update status:', order, newStatus);
  }

  onPrintInvoice(order: RecentOrder): void {
    // TODO: Implement print invoice functionality
    console.log('Print invoice:', order);
  }

  canAdvanceStatus(status: OrderStatus): boolean {
    return status !== OrderStatus.Delivered && status !== OrderStatus.Cancelled;
  }

  getNextStatus(status: OrderStatus): OrderStatus | null {
    switch (status) {
      case OrderStatus.Pending:
        return OrderStatus.Processing;
      case OrderStatus.Processing:
        return OrderStatus.Shipped;
      case OrderStatus.Shipped:
        return OrderStatus.Delivered;
      default:
        return null;
    }
  }

  getStatusDisplayText(status: OrderStatus): string {
    return this.adminService.getStatusDisplayText(status);
  }

  getStatusClass(status: OrderStatus): string {
    const properties = this.adminService.getStatusDisplayProperties(status);
    return properties.class;
  }

  formatCurrency(amount: number): string {
    return this.adminService.formatCurrency(amount);
  }

  formatDate(dateString: string): string {
    return this.adminService.formatDate(dateString);
  }

  trackByOrderId(index: number, order: RecentOrder): string {
    return order.id;
  }
} 