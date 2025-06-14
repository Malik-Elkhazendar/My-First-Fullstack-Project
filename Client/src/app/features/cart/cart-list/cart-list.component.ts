import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../core/services/cart.service';
import { MockCheckoutDialogComponent } from './mock-checkout-dialog';
import { ImageService } from '../../../core/services/image.service';

@Component({
  selector: 'app-cart-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './cart-list.component.html',
  styleUrl: './cart-list.component.scss'
})
export class CartListComponent implements OnInit {
  cartItems: CartItem[] = [];
  displayedColumns: string[] = ['image', 'name', 'price', 'quantity', 'total', 'actions'];
  loading = true;
  cartTotal = 0;
  processingCheckout = false;

  constructor(
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
    private imageService: ImageService
  ) { }

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
      this.cartTotal = this.cartService.getCartTotal();
      this.loading = false;
    });
  }

  // Navigation
  viewProduct(product: any): void {
    this.router.navigate(['/products', product.id]);
  }

  // Quantity Management
  updateQuantity(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);
    
    if (newQuantity > 0 && newQuantity <= 99) {
      this.cartService.updateQuantity(item.product.id, newQuantity);
      this.snackBar.open('Quantity updated', 'Close', { 
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    } else if (newQuantity > 99) {
      // Reset to 99 if the input exceeds maximum
      this.cartService.updateQuantity(item.product.id, 99);
      input.value = '99';
      this.snackBar.open('Maximum quantity is 99', 'Close', { 
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    } else {
      // Reset to 1 if the input is invalid
      this.cartService.updateQuantity(item.product.id, 1);
      input.value = '1';
      this.snackBar.open('Minimum quantity is 1', 'Close', { 
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  incrementQuantity(item: CartItem): void {
    if (item.quantity < 99) {
      this.cartService.updateQuantity(item.product.id, item.quantity + 1);
    } else {
      this.snackBar.open('Maximum quantity is 99', 'Close', { 
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  decrementQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.product.id, item.quantity - 1);
    }
  }

  removeItem(productId: number): void {
    const item = this.cartItems.find(item => item.product.id === productId);
    this.cartService.removeFromCart(productId);
    
    this.snackBar.open(
      `${item?.product.name || 'Item'} removed from cart`, 
      'Undo', 
      { 
        duration: 5000,
        panelClass: ['info-snackbar']
      }
    ).onAction().subscribe(() => {
      // Undo functionality - add the item back
      if (item) {
        this.cartService.addToCart(item.product, item.quantity);
        this.snackBar.open('Item restored to cart', 'Close', { 
          duration: 2000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  clearCart(): void {
    if (this.cartItems.length === 0) {
      this.snackBar.open('Your cart is already empty', 'Close', { 
        duration: 3000,
        panelClass: ['info-snackbar']
      });
      return;
    }

    // Store items for potential undo
    const itemsBackup = [...this.cartItems];
    
    this.cartService.clearCart();
    this.snackBar.open(
      `${itemsBackup.length} items removed from cart`, 
      'Undo', 
      { 
        duration: 8000,
        panelClass: ['warning-snackbar']
      }
    ).onAction().subscribe(() => {
      // Restore all items
      itemsBackup.forEach(item => {
        this.cartService.addToCart(item.product, item.quantity);
      });
      this.snackBar.open('Cart restored', 'Close', { 
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    });
  }

  checkout(): void {
    if (this.cartItems.length === 0) {
      this.snackBar.open('Your cart is empty', 'Close', { 
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    // Check for out of stock items
    const outOfStockItems = this.cartItems.filter(item => !item.product.inStock);
    if (outOfStockItems.length > 0) {
      this.snackBar.open(
        `Please remove out of stock items before checkout`, 
        'Close', 
        { 
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
      return;
    }

    // Navigate to checkout page
    this.router.navigate(['/cart/checkout']);
  }

  // Utility Methods
  trackByProductId(index: number, item: CartItem): number {
    return item.product.id;
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

  // Calculate savings if there are any discounted items
  getTotalSavings(): number {
    return this.cartItems.reduce((savings, item) => {
      if (item.product.originalPrice && item.product.originalPrice > item.product.price) {
        return savings + ((item.product.originalPrice - item.product.price) * item.quantity);
      }
      return savings;
    }, 0);
  }

  // Get total number of items (considering quantities)
  getTotalItemCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }
} 