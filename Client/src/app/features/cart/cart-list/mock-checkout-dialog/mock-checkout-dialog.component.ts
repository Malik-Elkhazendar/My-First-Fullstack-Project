import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CartItem } from '../../../../core/services/cart.service';
import { ImageService } from '../../../../core/services/image.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AddressService } from '../../../../core/services/address.service';
import { OrderService } from '../../../../core/services/order.service';
import { User } from '../../../../core/models/user.model';
import { AddressResponse, AddressType } from '../../../../core/models/address.model';
import { CreateOrderRequest, PaymentMethod } from '../../../../core/models/order.model';

export interface CheckoutDialogData {
  cartItems: CartItem[];
  cartTotal: number;
}

@Component({
  selector: 'app-mock-checkout-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatSelectModule,
    MatRadioModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './mock-checkout-dialog.component.html',
  styleUrl: './mock-checkout-dialog.component.scss'
})
export class MockCheckoutDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentStep = 1;
  totalSteps = 3;
  isProcessing = false;
  
  // User and authentication
  currentUser: User | null = null;
  isLoggedIn = false;
  
  // Address management
  savedAddresses: AddressResponse[] = [];
  addressLoading = false;
  selectedAddressId: number | null = null;
  useNewAddress = false;
  
  // Form fields
  paymentInfo = {
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  };
  
  shippingInfo = {
    fullName: '',
    address: '',
    city: '',
    zipCode: '',
    country: ''
  };

  constructor(
    public dialogRef: MatDialogRef<MockCheckoutDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CheckoutDialogData,
    private imageService: ImageService,
    private authService: AuthService,
    private addressService: AddressService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
        
        if (this.isLoggedIn) {
          this.loadSavedAddresses();
          // Pre-fill shipping info with user data
          if (user) {
            this.shippingInfo.fullName = `${user.firstName} ${user.lastName}`;
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSavedAddresses(): void {
    this.addressLoading = true;
    this.addressService.getAddresses({ type: AddressType.Shipping })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.savedAddresses = response.addresses.filter(addr => 
            addr.type === AddressType.Shipping || addr.type === AddressType.Both
          );
          
          // Auto-select default address if available
          const defaultAddress = this.savedAddresses.find(addr => addr.isDefault);
          if (defaultAddress) {
            this.selectedAddressId = defaultAddress.id!;
            this.useNewAddress = false;
            this.populateShippingFromAddress(defaultAddress);
          } else if (this.savedAddresses.length > 0) {
            // Select first address if no default
            this.selectedAddressId = this.savedAddresses[0].id!;
            this.useNewAddress = false;
            this.populateShippingFromAddress(this.savedAddresses[0]);
          } else {
            // No saved addresses, use new address form
            this.useNewAddress = true;
          }
          
          this.addressLoading = false;
        },
        error: (error) => {
          console.error('Error loading addresses:', error);
          this.addressLoading = false;
          this.useNewAddress = true;
        }
      });
  }

  onAddressSelectionChange(): void {
    if (this.useNewAddress) {
      // Clear form for new address
      this.shippingInfo = {
        fullName: this.currentUser ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : '',
        address: '',
        city: '',
        zipCode: '',
        country: ''
      };
    } else if (this.selectedAddressId) {
      // Populate form with selected address
      const selectedAddress = this.savedAddresses.find(addr => addr.id === this.selectedAddressId);
      if (selectedAddress) {
        this.populateShippingFromAddress(selectedAddress);
      }
    }
  }

  private populateShippingFromAddress(address: AddressResponse): void {
    this.shippingInfo = {
      fullName: `${address.firstName} ${address.lastName}`,
      address: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}`,
      city: address.city,
      zipCode: address.postalCode,
      country: address.country
    };
  }

  getShippingAddresses(): AddressResponse[] {
    return this.savedAddresses.filter(addr => 
      addr.type === AddressType.Shipping || addr.type === AddressType.Both
    );
  }

  formatAddressOneLine(address: AddressResponse): string {
    return this.addressService.formatAddressOneLine(address);
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submitOrder(): void {
    this.isProcessing = true;
    
    // Create order request from cart items and form data
    const orderRequest: CreateOrderRequest = {
      items: this.data.cartItems.map(cartItem => ({
        productId: cartItem.product.id,
        quantity: cartItem.quantity,
        productSnapshot: {
          name: cartItem.product.name,
          price: cartItem.product.price,
          imageUrl: cartItem.product.imageUrl
        }
      })),
      addressSelection: {
        useShippingAsBilling: true, // For simplicity, use shipping as billing
        newShippingAddress: this.useNewAddress ? {
          type: AddressType.Shipping,
          label: 'Checkout Address',
          firstName: this.shippingInfo.fullName.split(' ')[0] || '',
          lastName: this.shippingInfo.fullName.split(' ').slice(1).join(' ') || '',
          addressLine1: this.shippingInfo.address,
          city: this.shippingInfo.city,
          state: '', // Add state field if needed
          postalCode: this.shippingInfo.zipCode,
          country: this.shippingInfo.country,
          phoneNumber: '', // Add phone field if needed
          isDefault: false
        } : undefined,
        shippingAddressId: !this.useNewAddress && this.selectedAddressId ? this.selectedAddressId : undefined
      },
      paymentMethod: PaymentMethod.CreditCard,
      notes: 'Order placed through checkout',
      saveShippingAddress: this.useNewAddress && this.isLoggedIn
    };

    // Call the order service to create the order
    this.orderService.createOrder(orderRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          this.isProcessing = false;
          this.dialogRef.close({ success: true, order });
        },
        error: (error) => {
          console.error('Error creating order:', error);
          this.isProcessing = false;
          this.dialogRef.close({ success: false, error: error.message });
        }
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
  
  // Image handling methods
  getImageUrl(path: string): string {
    return this.imageService.getImageUrl(path);
  }

  handleImageError(event: Event): void {
    this.imageService.handleImageError(event);
  }
  
  // Format price to 2 decimal places
  formatPrice(price: number): string {
    return price.toFixed(2);
  }
} 