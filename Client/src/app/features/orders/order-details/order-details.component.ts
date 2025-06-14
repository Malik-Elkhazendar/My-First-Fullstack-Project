import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil, switchMap, delay } from 'rxjs/operators';

import { OrderService } from '../../../core/services/order.service';
import { ImageService } from '../../../core/services/image.service';
import { CartService } from '../../../core/services/cart.service';
import { 
  Order, 
  OrderStatus, 
  PaymentMethod, 
  PaymentStatus 
} from '../../../core/models/order.model';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  order: Order | null = null;
  loading = false;
  orderId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private imageService: ImageService,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.orderId = +params['id'];
        this.loading = true;
        this.cdr.markForCheck();
        
        // For now, use mock data with a delay to simulate loading
        return of(this.getMockOrderById(this.orderId)).pipe(delay(500));
      })
    ).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.showError('Failed to load order details');
        this.router.navigate(['/orders']);
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getMockOrderById(id: number): Order {
    // Mock data matching the orders list component
    const mockOrders: Order[] = [
      {
        id: 1,
        orderNumber: 'ORD-2024-001',
        userId: 1,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        status: OrderStatus.Delivered,
        totalAmount: 299.99,
        subtotal: 249.99,
        shippingCost: 15.00,
        taxAmount: 35.00,
        discountAmount: 0,
        items: [
          {
            id: 1,
            productId: 1,
            product: {
              id: 1,
              name: 'Wireless Headphones',
              description: 'High-quality wireless headphones with noise cancellation',
              price: 199.99,
              imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
              category: 'Electronics',
              inStock: true,
              rating: 4.5
            },
            quantity: 1,
            unitPrice: 199.99,
            totalPrice: 199.99
          },
          {
            id: 2,
            productId: 2,
            product: {
              id: 2,
              name: 'Phone Case',
              description: 'Protective phone case with premium materials',
              price: 49.99,
              imageUrl: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop',
              category: 'Accessories',
              inStock: true,
              rating: 4.2
            },
            quantity: 1,
            unitPrice: 49.99,
            totalPrice: 49.99
          }
        ],
        shippingAddress: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
          phoneNumber: '+1234567890',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        billingAddress: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
          phoneNumber: '+1234567890',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        paymentInfo: {
          id: 1,
          paymentMethod: PaymentMethod.CreditCard,
          paymentStatus: PaymentStatus.Completed,
          amount: 299.99,
          currency: 'USD',
          paidAt: new Date('2024-01-15')
        },
        trackingNumber: 'TRK123456789',
        estimatedDeliveryDate: new Date('2024-01-20'),
        notes: 'Please leave package at front door if no one is home.'
      },
      {
        id: 2,
        orderNumber: 'ORD-2024-002',
        userId: 2,
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
        status: OrderStatus.Processing,
        totalAmount: 149.99,
        subtotal: 129.99,
        shippingCost: 10.00,
        taxAmount: 10.00,
        discountAmount: 0,
        items: [
          {
            id: 3,
            productId: 3,
            product: {
              id: 3,
              name: 'Modern Desk Lamp',
              description: 'Stylish LED desk lamp with adjustable brightness',
              price: 129.99,
              imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop',
              category: 'Home & Garden',
              inStock: true,
              rating: 4.7
            },
            quantity: 1,
            unitPrice: 129.99,
            totalPrice: 129.99
          }
        ],
        shippingAddress: {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          addressLine1: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210',
          country: 'USA',
          phoneNumber: '+1987654321',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        billingAddress: {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          addressLine1: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210',
          country: 'USA',
          phoneNumber: '+1987654321',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        paymentInfo: {
          id: 2,
          paymentMethod: PaymentMethod.CreditCard,
          paymentStatus: PaymentStatus.Processing,
          amount: 149.99,
          currency: 'USD'
        },
        trackingNumber: 'TRK987654321',
        estimatedDeliveryDate: new Date('2024-01-25')
      },
      {
        id: 3,
        orderNumber: 'ORD-2024-003',
        userId: 3,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        status: OrderStatus.Pending,
        totalAmount: 89.99,
        subtotal: 79.99,
        shippingCost: 5.00,
        taxAmount: 5.00,
        discountAmount: 0,
        items: [
          {
            id: 4,
            productId: 4,
            product: {
              id: 4,
              name: 'Coffee Mug Set',
              description: 'Set of ceramic coffee mugs with elegant design',
              price: 79.99,
              imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop',
              category: 'Kitchen',
              inStock: true,
              rating: 4.3
            },
            quantity: 1,
            unitPrice: 79.99,
            totalPrice: 79.99
          }
        ],
        shippingAddress: {
          id: 3,
          firstName: 'Bob',
          lastName: 'Johnson',
          addressLine1: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
          country: 'USA',
          phoneNumber: '+1555123456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        billingAddress: {
          id: 3,
          firstName: 'Bob',
          lastName: 'Johnson',
          addressLine1: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
          country: 'USA',
          phoneNumber: '+1555123456',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        paymentInfo: {
          id: 3,
          paymentMethod: PaymentMethod.CreditCard,
          paymentStatus: PaymentStatus.Pending,
          amount: 89.99,
          currency: 'USD'
        },
        estimatedDeliveryDate: new Date('2024-01-28')
      }
    ];

    const order = mockOrders.find(o => o.id === id);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  // Enhanced utility methods
  getStatusDisplay(status: OrderStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
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

  trackByItemId(index: number, item: any): number {
    return item.id;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Action methods
  canCancelOrder(): boolean {
    if (!this.order) return false;
    return ['pending', 'confirmed', 'processing'].includes(this.order.status.toLowerCase());
  }

  canReorder(): boolean {
    if (!this.order) return false;
    return ['delivered', 'cancelled'].includes(this.order.status.toLowerCase());
  }

  onCancelOrder(): void {
    if (!this.order?.id) return;
    
    const confirmMessage = `Are you sure you want to cancel order ${this.order.orderNumber}?`;
    
    if (confirm(confirmMessage)) {
      // Update order status locally for demo
      this.order.status = OrderStatus.Cancelled;
      this.showSuccess('Order cancelled successfully');
      this.cdr.markForCheck();
    }
  }

  onTrackOrder(): void {
    if (this.order?.trackingNumber) {
      this.showInfo(`Tracking Number: ${this.order.trackingNumber}`);
      // In a real app, this would open a tracking dialog or navigate to tracking page
    } else {
      this.showInfo('Tracking information not available yet');
    }
  }

  onReorderItems(): void {
    if (!this.order) return;
    
    // Add all items from the order to cart
    this.order.items.forEach(item => {
      this.cartService.addToCart(item.product, item.quantity);
    });
    
    this.showSuccess(`${this.order.items.length} items added to cart from order ${this.order.orderNumber}`);
  }

  onImageError(event: Event): void {
    this.imageService.handleImageError(event);
  }

  onBackToOrders(): void {
    this.router.navigate(['/orders']);
  }

  // Snackbar methods
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
} 