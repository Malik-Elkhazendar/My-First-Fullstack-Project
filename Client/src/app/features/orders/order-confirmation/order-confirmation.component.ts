import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, switchMap, delay } from 'rxjs/operators';

import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../core/models/order.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  order: Order | null = null;
  currentUser: User | null = null;
  isLoggedIn = false;
  orderId: number | null = null;

  // Loading states
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadOrderData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
        this.cdr.markForCheck();
      });
  }

  private loadOrderData(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.orderId = +params['id'];
        if (!this.orderId) {
          throw new Error('Invalid order ID');
        }
        
        this.loading = true;
        this.cdr.markForCheck();
        
        // For now, use mock data with a delay to simulate loading
        // In production, this would be: return this.orderService.getOrderById(this.orderId);
        return of(this.getMockOrderById(this.orderId)).pipe(delay(800));
      })
    ).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
        this.error = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.loading = false;
        this.error = true;
        this.cdr.markForCheck();
      }
    });
  }

  private getMockOrderById(id: number): Order {
    // Mock order data - in production this would come from the OrderService
    const mockOrder: Order = {
      id: id,
      orderNumber: `ORD-2024-${String(id).padStart(6, '0')}`,
      userId: this.currentUser?.id || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'confirmed' as any,
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
            name: 'Premium Wireless Headphones',
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
        paymentMethod: 'credit_card' as any,
        paymentStatus: 'completed' as any,
        amount: 299.99,
        currency: 'USD',
        paidAt: new Date()
      }
    };

    return mockOrder;
  }

  // Navigation methods
  viewOrderDetails(): void {
    if (this.orderId) {
      this.router.navigate(['/orders/details', this.orderId]);
    }
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  // Utility methods
  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getEstimatedDeliveryDate(): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 business days
    return this.formatDate(deliveryDate);
  }
} 