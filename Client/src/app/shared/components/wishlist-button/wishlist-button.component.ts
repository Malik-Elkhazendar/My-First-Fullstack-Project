import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { WishlistService } from '../../../core/services/wishlist.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-wishlist-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlist-button.component.html',
  styleUrls: ['./wishlist-button.component.scss']
})
export class WishlistButtonComponent implements OnInit, OnDestroy {
  @Input() product!: Product;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() variant: 'icon' | 'button' = 'icon';
  @Input() showText = false;

  isInWishlist = false;
  isLoading = false;
  
  private destroy$ = new Subject<void>();

  constructor(private wishlistService: WishlistService) {}

  ngOnInit(): void {
    this.checkWishlistStatus();
    this.subscribeToWishlistChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if product is currently in wishlist
   */
  private checkWishlistStatus(): void {
    this.isInWishlist = this.wishlistService.isInWishlist(this.product.id);
  }

  /**
   * Subscribe to wishlist changes to update button state
   */
  private subscribeToWishlistChanges(): void {
    this.wishlistService.getWishlistItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkWishlistStatus();
      });
  }

  /**
   * Toggle product in/out of wishlist
   */
  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    try {
      const wasAdded = this.wishlistService.toggleWishlist(this.product);
      
      // Provide user feedback
      if (wasAdded) {
        console.log(`Added "${this.product.name}" to wishlist`);
      } else {
        console.log(`Removed "${this.product.name}" from wishlist`);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get button classes based on props
   */
  getButtonClasses(): string {
    const classes = ['wishlist-button'];
    
    classes.push(`wishlist-button--${this.size}`);
    classes.push(`wishlist-button--${this.variant}`);
    
    if (this.isInWishlist) {
      classes.push('wishlist-button--active');
    }
    
    if (this.isLoading) {
      classes.push('wishlist-button--loading');
    }
    
    return classes.join(' ');
  }

  /**
   * Get button title for accessibility
   */
  getButtonTitle(): string {
    if (this.isLoading) {
      return 'Processing...';
    }
    
    return this.isInWishlist 
      ? `Remove "${this.product.name}" from wishlist`
      : `Add "${this.product.name}" to wishlist`;
  }

  /**
   * Get button text
   */
  getButtonText(): string {
    if (this.isLoading) {
      return 'Processing...';
    }
    
    return this.isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist';
  }
} 