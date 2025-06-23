import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { WishlistService, CartService, WishlistItem, Product } from '../../core';
import { WishlistItemComponent } from '../../shared/components/wishlist-item/wishlist-item.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, FormsModule, WishlistItemComponent],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss']
})
export class WishlistComponent implements OnInit, OnDestroy {
  wishlistItems: WishlistItem[] = [];
  isLoading = true;
  selectedCategory = 'all';
  sortBy = 'newest';
  
  private destroy$ = new Subject<void>();

  // Available categories for filtering
  categories: string[] = [];
  
  // Sort options
  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load wishlist items and set up subscription
   */
  private loadWishlist(): void {
    this.isLoading = true;
    
    this.wishlistService.getWishlistItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.wishlistItems = items;
          this.updateCategories();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading wishlist:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Update available categories based on current wishlist items
   */
  private updateCategories(): void {
    const categorySet = new Set<string>();
    this.wishlistItems.forEach(item => {
      categorySet.add(item.product.category);
    });
    this.categories = Array.from(categorySet).sort();
  }

  /**
   * Get filtered and sorted wishlist items
   */
  getFilteredItems(): WishlistItem[] {
    let filteredItems = [...this.wishlistItems];

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.product.category.toLowerCase() === this.selectedCategory.toLowerCase()
      );
    }

    // Sort items
    return this.sortItems(filteredItems);
  }

  /**
   * Sort items based on selected sort option
   */
  private sortItems(items: WishlistItem[]): WishlistItem[] {
    switch (this.sortBy) {
      case 'newest':
        return items.sort((a, b) => 
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
      case 'oldest':
        return items.sort((a, b) => 
          new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()
        );
      case 'name':
        return items.sort((a, b) => 
          a.product.name.localeCompare(b.product.name)
        );
      case 'price-low':
        return items.sort((a, b) => 
          a.product.price - b.product.price
        );
      case 'price-high':
        return items.sort((a, b) => 
          b.product.price - a.product.price
        );
      default:
        return items;
    }
  }

  /**
   * Handle category filter change
   */
  onCategoryChange(category: string): void {
    this.selectedCategory = category;
  }

  /**
   * Handle sort option change
   */
  onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
  }

  /**
   * Remove item from wishlist
   */
  onRemoveFromWishlist(productId: number): void {
    const success = this.wishlistService.removeFromWishlist(productId);
    if (success) {
      // Items will be updated automatically through the subscription
      console.log('Product removed from wishlist');
    }
  }

  /**
   * Add item to cart
   */
  onAddToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
    console.log('Product added to cart:', product.name);
  }

  /**
   * View product details
   */
  onViewProduct(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  /**
   * Add all wishlist items to cart
   */
  addAllToCart(): void {
    const availableItems = this.wishlistItems.filter(item => item.product.inStock);
    
    if (availableItems.length === 0) {
      console.log('No available items to add to cart');
      return;
    }

    availableItems.forEach(item => {
      this.cartService.addToCart(item.product, 1);
    });

    console.log(`Added ${availableItems.length} items to cart`);
  }

  /**
   * Clear all items from wishlist with confirmation
   */
  clearWishlist(): void {
    if (this.wishlistItems.length === 0) {
      return;
    }

    const dialogData: ConfirmationDialogData = {
      title: 'Clear Wishlist',
      message: `Are you sure you want to remove all ${this.wishlistItems.length} items from your wishlist?`,
      details: 'This action cannot be undone.',
      type: 'warning',
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      icon: 'delete_sweep'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.performClearWishlist();
      }
    });
  }

  /**
   * Perform the actual wishlist clearing
   */
  private performClearWishlist(): void {
    this.wishlistService.clearWishlist();
    this.showSuccess('Wishlist cleared successfully');
  }

  /**
   * Continue shopping - navigate to products page
   */
  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Get total wishlist value
   */
  getTotalValue(): number {
    return this.wishlistItems.reduce((total, item) => total + item.product.price, 0);
  }

  /**
   * Get count of available items (in stock)
   */
  getAvailableItemsCount(): number {
    return this.wishlistItems.filter(item => item.product.inStock).length;
  }

  /**
   * Get count of out of stock items
   */
  getOutOfStockItemsCount(): number {
    return this.wishlistItems.filter(item => !item.product.inStock).length;
  }

  /**
   * Check if wishlist is empty
   */
  get isWishlistEmpty(): boolean {
    return this.wishlistItems.length === 0;
  }

  /**
   * Get wishlist item count
   */
  get itemCount(): number {
    return this.wishlistItems.length;
  }

  /**
   * TrackBy function for ngFor optimization
   */
  trackByItemId(index: number, item: WishlistItem): string {
    return item.id;
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}
