import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CartService, CartItem } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { ImageService } from '../../../core/services/image.service';
import { User } from '../../../core/models/user.model';
import { CreateOrderRequest, PaymentMethod } from '../../../core/models/order.model';
import { AddressResponse, AddressType, CreateAddressRequest } from '../../../core/models/address.model';

interface ReviewOrderData {
  cartItems: CartItem[];
  shippingAddress: AddressResponse | CreateAddressRequest;
  paymentMethod: {
    type: PaymentMethod;
    displayText: string;
    last4?: string;
    brand?: string;
    expiryDate?: string;
  };
  orderSummary: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
}

@Component({
  selector: 'app-order-review',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './order-review.component.html',
  styleUrls: ['./order-review.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderReviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Expose enum to template
  PaymentMethod = PaymentMethod;

  // Data
  reviewData: ReviewOrderData | null = null;
  currentUser: User | null = null;
  isLoggedIn = false;

  // Loading states
  loading = true;
  processingOrder = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private orderService: OrderService,
    private imageService: ImageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReviewData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadReviewData(): void {
    // Load cart items
    this.cartService.getCartItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        if (items.length === 0) {
          // No items in cart, redirect to cart
          this.router.navigate(['/cart']);
          return;
        }

        // Load user data
        this.authService.currentUser$
          .pipe(takeUntil(this.destroy$))
          .subscribe(user => {
            this.currentUser = user;
            this.isLoggedIn = !!user;
            
            // Build review data from session storage or form data
            this.buildReviewData(items);
            this.loading = false;
            this.cdr.markForCheck();
          });
      });
  }

  private buildReviewData(cartItems: CartItem[]): void {
    // Get checkout data from session storage (set by checkout component)
    const checkoutData = this.getCheckoutDataFromSession();
    
    if (!checkoutData) {
      // No checkout data found, redirect to checkout
      this.router.navigate(['/checkout']);
      return;
    }

    const subtotal = this.cartService.getCartTotal();
    const shipping = 5.00; // Fixed shipping cost
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    this.reviewData = {
      cartItems,
      shippingAddress: checkoutData.shippingAddress,
      paymentMethod: checkoutData.paymentMethod,
      orderSummary: {
        subtotal,
        shipping,
        tax,
        total
      }
    };
  }

  private getCheckoutDataFromSession(): any {
    try {
      const data = sessionStorage.getItem('checkoutData');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error parsing checkout data:', error);
      return null;
    }
  }

  async confirmOrder(): Promise<void> {
    if (!this.reviewData || this.processingOrder) {
      return;
    }

    this.processingOrder = true;
    this.cdr.markForCheck();

    try {
      const orderRequest = this.buildOrderRequest();
      
      const order = await this.orderService.createOrder(orderRequest).toPromise();
      
      if (order && order.id) {
        // Clear cart and session data
        this.cartService.clearCart();
        sessionStorage.removeItem('checkoutData');
        
        // Navigate to order confirmation
        this.router.navigate(['/orders/confirmation', order.id]);
      } else {
        throw new Error('Order creation failed');
      }
    } catch (error) {
      console.error('Order confirmation error:', error);
      this.showError('There was an error processing your order. Please try again.');
    } finally {
      this.processingOrder = false;
      this.cdr.markForCheck();
    }
  }

  private buildOrderRequest(): CreateOrderRequest {
    if (!this.reviewData) {
      throw new Error('No review data available');
    }

    // Build shipping address
    let newShippingAddress: CreateAddressRequest;
    
    if ('id' in this.reviewData.shippingAddress) {
      // Using existing address
      const existingAddress = this.reviewData.shippingAddress as AddressResponse;
      newShippingAddress = {
        type: AddressType.Shipping,
        label: 'Shipping Address',
        firstName: existingAddress.firstName,
        lastName: existingAddress.lastName,
        addressLine1: existingAddress.addressLine1,
        addressLine2: existingAddress.addressLine2 || '',
        city: existingAddress.city,
        state: existingAddress.state,
        postalCode: existingAddress.postalCode,
        country: existingAddress.country,
        phoneNumber: existingAddress.phoneNumber,
        isDefault: false
      };
    } else {
      // Using new address
      newShippingAddress = this.reviewData.shippingAddress as CreateAddressRequest;
    }

    // Build order items
    const orderItems = this.reviewData.cartItems.map(item => ({
      productId: item.product.id!,
      quantity: item.quantity
    }));

    return {
      items: orderItems,
      addressSelection: {
        useShippingAsBilling: true,
        newShippingAddress: newShippingAddress
      },
      paymentMethod: this.reviewData.paymentMethod.type,
      notes: ''
    };
  }

  // Navigation methods
  goBackToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  // Utility methods
  getImageUrl(path: string): string {
    return this.imageService.getImageUrl(path);
  }

  handleImageError(event: Event): void {
    this.imageService.handleImageError(event);
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  formatAddress(address: AddressResponse | CreateAddressRequest): string {
    return `${address.firstName} ${address.lastName}, ${address.addressLine1}, ${address.city}, ${address.state} ${address.postalCode}`;
  }

  getPaymentMethodIcon(type: PaymentMethod): string {
    switch (type) {
      case PaymentMethod.CreditCard:
        return 'credit_card';
      case PaymentMethod.PayPal:
        return 'account_balance_wallet';
      default:
        return 'payment';
    }
  }

  private showError(message: string): void {
    // You can implement a toast/snackbar service here
    alert(message);
  }

  // Track by functions for performance
  trackByItemId(index: number, item: CartItem): number {
    return item.product.id || index;
  }
} 