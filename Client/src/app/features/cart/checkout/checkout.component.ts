import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CartService, CartItem } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { AddressService } from '../../../core/services/address.service';
import { OrderService } from '../../../core/services/order.service';
import { ImageService } from '../../../core/services/image.service';
import { User } from '../../../core/models/user.model';
import { AddressResponse, AddressType, CreateAddressRequest } from '../../../core/models/address.model';
import { CreateOrderRequest, PaymentMethod } from '../../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Form
  checkoutForm!: FormGroup;

  // Data
  cartItems: CartItem[] = [];
  cartTotal = 0;
  cartItemCount = 0;
  currentUser: User | null = null;
  isLoggedIn = false;
  savedAddresses: AddressResponse[] = [];
  savedPaymentMethods: any[] = []; // For demo purposes

  // Loading states
  loading = true;
  processingOrder = false;
  loadingAddresses = false;

  // Order summary
  subtotal = 0;
  shipping = 5.00; // Fixed shipping cost
  tax = 0;
  total = 0;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private authService: AuthService,
    private addressService: AddressService,
    private orderService: OrderService,
    private imageService: ImageService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCheckoutData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.checkoutForm = this.fb.group({
      // Address Selection
      useExistingAddress: [false],
      selectedAddressId: [''],
      
      // Shipping Information
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      state: ['', [Validators.required, Validators.minLength(2)]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      
      // Payment Selection
      useExistingPayment: [false],
      selectedPaymentId: [''],
      
      // Payment Information
      paymentMethod: ['creditCard', Validators.required],
      cardNumber: [''],
      expiryDate: [''],
      cvv: ['']
    });

    // Watch for payment method changes to update validators
    this.checkoutForm.get('paymentMethod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(method => {
        this.updatePaymentValidators(method);
      });

    // Watch for address selection changes
    this.checkoutForm.get('useExistingAddress')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(useExisting => {
        this.updateAddressValidators(useExisting);
      });

    // Watch for selected address changes
    this.checkoutForm.get('selectedAddressId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(addressId => {
        if (addressId) {
          this.fillAddressFromSaved(addressId);
        }
    });

    // Watch for payment selection changes
    this.checkoutForm.get('useExistingPayment')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(useExisting => {
        this.updatePaymentValidators(useExisting ? 'existing' : 'creditCard');
      });

    // Initialize with credit card validators
    this.updatePaymentValidators('creditCard');
  }

  private updatePaymentValidators(paymentMethod: string): void {
    const cardNumberControl = this.checkoutForm.get('cardNumber');
    const expiryDateControl = this.checkoutForm.get('expiryDate');
    const cvvControl = this.checkoutForm.get('cvv');

    if (paymentMethod === 'creditCard') {
      cardNumberControl?.setValidators([
        Validators.required,
        Validators.pattern(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/)
      ]);
      expiryDateControl?.setValidators([
        Validators.required,
        Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)
      ]);
      cvvControl?.setValidators([
        Validators.required,
        Validators.pattern(/^\d{3,4}$/)
      ]);
    } else {
      cardNumberControl?.clearValidators();
      expiryDateControl?.clearValidators();
      cvvControl?.clearValidators();
    }

    cardNumberControl?.updateValueAndValidity();
    expiryDateControl?.updateValueAndValidity();
    cvvControl?.updateValueAndValidity();
  }

  private loadCheckoutData(): void {
    // Load cart items
    this.cartService.getCartItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = items;
        this.cartItemCount = this.cartService.getCartItemCount();
        this.calculateTotals();
        
        if (this.cartItems.length === 0) {
          this.router.navigate(['/cart']);
          return;
        }
        
        this.loading = false;
      });

    // Load user data
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
        
        if (this.isLoggedIn && user) {
          this.prefillUserData(user);
          this.loadSavedAddresses();
          this.loadSavedPaymentMethods();
        }
      });
  }

  private prefillUserData(user: User): void {
    this.checkoutForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });
  }

  private calculateTotals(): void {
    this.subtotal = this.cartService.getCartTotal();
    // Fixed shipping cost of $5.00
    this.shipping = 5.00;
    this.tax = 0; // No tax calculation for simplicity
    this.total = this.subtotal + this.shipping + this.tax;
    this.cartTotal = this.total;
  }

  async processOrder(): Promise<void> {
    if (this.checkoutForm.invalid || this.processingOrder) {
      return;
    }

    this.processingOrder = true;

    try {
      // Check for out of stock items
      const outOfStockItems = this.cartItems.filter(item => !item.product.inStock);
      if (outOfStockItems.length > 0) {
        alert('Some items are out of stock. Please remove them from your cart.');
            this.processingOrder = false;
        return;
      }

      // Save checkout data to session storage for review page
      const checkoutData = this.buildCheckoutDataForReview();
      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
      
      // Navigate to order review page
      this.router.navigate(['/orders/review']);
    } catch (error) {
      console.error('Checkout processing error:', error);
      alert('There was an error processing your checkout. Please try again.');
    } finally {
      this.processingOrder = false;
    }
  }

  private buildCheckoutDataForReview(): any {
    const formValue = this.checkoutForm.value;
    
    // Build shipping address
    let shippingAddress: any;
    
    if (formValue.useExistingAddress && formValue.selectedAddressId) {
      // Using existing address
      shippingAddress = this.savedAddresses.find(addr => addr.id.toString() === formValue.selectedAddressId);
    } else {
      // Using new address
      shippingAddress = {
        type: AddressType.Shipping,
        label: 'Shipping Address',
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        addressLine1: formValue.address,
        addressLine2: '',
        city: formValue.city,
        state: formValue.state,
        postalCode: formValue.zipCode,
        country: 'US',
        phoneNumber: '', // Could be added to form if needed
        isDefault: false
      };
    }

    // Build payment method info
    let paymentMethod: any;
    
    if (formValue.useExistingPayment && formValue.selectedPaymentId) {
      // Using existing payment method
      const savedPayment = this.savedPaymentMethods.find(pm => pm.id === formValue.selectedPaymentId);
      paymentMethod = {
        type: PaymentMethod.CreditCard,
        displayText: this.getPaymentDisplayText(savedPayment),
        last4: savedPayment.last4,
        brand: savedPayment.brand,
        expiryDate: `${savedPayment.expiryMonth}/${savedPayment.expiryYear}`
      };
    } else {
      // Using new payment method
      const methodType = formValue.paymentMethod === 'creditCard' ? PaymentMethod.CreditCard : PaymentMethod.PayPal;
      paymentMethod = {
        type: methodType,
        displayText: methodType === PaymentMethod.CreditCard ? 'Credit Card' : 'PayPal'
      };
      
      if (methodType === PaymentMethod.CreditCard && formValue.cardNumber) {
        paymentMethod.last4 = formValue.cardNumber.slice(-4);
        paymentMethod.expiryDate = formValue.expiryDate;
      }
    }

    return {
      shippingAddress,
      paymentMethod
    };
  }

  private async buildOrderRequest(): Promise<CreateOrderRequest> {
    const formValue = this.checkoutForm.value;
    
    // Build shipping address
    const newShippingAddress: CreateAddressRequest = {
      type: AddressType.Shipping,
      label: 'Shipping Address',
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      addressLine1: formValue.address,
      addressLine2: '',
      city: formValue.city,
      state: formValue.state,
      postalCode: formValue.zipCode,
      country: 'US',
      isDefault: false
    };

    // Build order items
    const orderItems = this.cartItems.map(item => ({
      productId: item.product.id!,
      quantity: item.quantity
    }));

    return {
      items: orderItems,
      addressSelection: {
        useShippingAsBilling: true,
        newShippingAddress: newShippingAddress
      },
      paymentMethod: formValue.paymentMethod === 'creditCard' ? PaymentMethod.CreditCard : PaymentMethod.PayPal,
      notes: ''
    };
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

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  // Address management methods
  private updateAddressValidators(useExisting: boolean): void {
    const addressControls = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];
    
    addressControls.forEach(controlName => {
      const control = this.checkoutForm.get(controlName);
      if (useExisting) {
        control?.clearValidators();
      } else {
        // Re-add original validators
        switch (controlName) {
          case 'firstName':
          case 'lastName':
            control?.setValidators([Validators.required, Validators.minLength(2)]);
            break;
          case 'address':
            control?.setValidators([Validators.required, Validators.minLength(5)]);
            break;
          case 'city':
          case 'state':
            control?.setValidators([Validators.required, Validators.minLength(2)]);
            break;
          case 'zipCode':
            control?.setValidators([Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]);
            break;
        }
      }
      control?.updateValueAndValidity();
    });
  }

  private fillAddressFromSaved(addressId: string): void {
    const address = this.savedAddresses.find(addr => addr.id.toString() === addressId);
    if (address) {
      this.checkoutForm.patchValue({
        firstName: address.firstName,
        lastName: address.lastName,
        address: address.addressLine1,
        city: address.city,
        state: address.state,
        zipCode: address.postalCode
      });
    }
  }

  private loadSavedAddresses(): void {
    if (!this.currentUser?.id) return;
    
    this.loadingAddresses = true;
    this.addressService.getAddresses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.savedAddresses = response.addresses;
          this.loadingAddresses = false;
        },
        error: (error: any) => {
          console.error('Error loading addresses:', error);
          this.loadingAddresses = false;
        }
      });
  }

  private loadSavedPaymentMethods(): void {
    // For demo purposes, create some mock payment methods
    this.savedPaymentMethods = [
      {
        id: '1',
        type: 'creditCard',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 25,
        isDefault: true
      },
      {
        id: '2',
        type: 'creditCard',
        last4: '0005',
        brand: 'Mastercard',
        expiryMonth: 8,
        expiryYear: 26,
        isDefault: false
      }
    ];
  }

  onAddressSelectionChange(useExisting: boolean): void {
    this.checkoutForm.patchValue({ useExistingAddress: useExisting });
    if (!useExisting) {
      this.checkoutForm.patchValue({ selectedAddressId: '' });
    }
  }

  onPaymentSelectionChange(useExisting: boolean): void {
    this.checkoutForm.patchValue({ useExistingPayment: useExisting });
    if (!useExisting) {
      this.checkoutForm.patchValue({ selectedPaymentId: '' });
    }
  }

  getAddressDisplayText(address: AddressResponse): string {
    return `${address.firstName} ${address.lastName}, ${address.addressLine1}, ${address.city}, ${address.state} ${address.postalCode}`;
  }

  getPaymentDisplayText(payment: any): string {
    return `${payment.brand} ending in ${payment.last4} (${payment.expiryMonth}/${payment.expiryYear})`;
  }
} 