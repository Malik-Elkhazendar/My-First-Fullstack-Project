import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product, ImageService, WishlistService, ProductService } from '../../../core';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCartEvent = new EventEmitter<Product>();
  @Output() quickViewEvent = new EventEmitter<Product>();

  // Component state
  imageLoading = true;
  addingToCart = false;

  constructor(
    private imageService: ImageService,
    private wishlistService: WishlistService,
    private productService: ProductService
  ) {}

  /**
   * Handles image loading errors by replacing with a placeholder
   */
  handleImageError(event: Event): void {
    this.imageService.handleImageError(event);
    this.imageLoading = false;
  }

  /**
   * Handles successful image loading
   */
  onImageLoad(event: Event): void {
    this.imageLoading = false;
  }

  /**
   * Gets the proper image URL
   */
  getImageUrl(path: string): string {
    return this.imageService.getImageUrl(path);
  }

  /**
   * Calculate discount percentage
   */
  get discountPercentage(): number {
    return this.productService.calculateDiscount(this.product);
  }

  /**
   * Generate star array for rating display
   */
  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  /**
   * Adds the product to the cart with loading state
   */
  async addToCart(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.product.inStock || this.addingToCart) {
      return;
    }

    this.addingToCart = true;
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      this.addToCartEvent.emit(this.product);
    } finally {
      this.addingToCart = false;
    }
  }

  /**
   * Handle keyboard events for add to cart button
   */
  onAddToCartKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.addToCart(event);
    }
  }

  /**
   * Opens quick view modal
   */
  quickView(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.quickViewEvent.emit(this.product);
  }

  /**
   * Handle keyboard events for quick view button
   */
  onQuickViewKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.quickView(event);
    }
  }

  /**
   * Checks if product is in wishlist
   */
  isInWishlist(): boolean {
    return this.wishlistService.isInWishlist(this.product.id);
  }

  /**
   * Toggles product in wishlist with accessibility support
   */
  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    const wasInWishlist = this.isInWishlist();
    this.wishlistService.toggleWishlist(this.product);
    
    // Announce to screen readers
    const action = wasInWishlist ? 'removed from' : 'added to';
    const message = `${this.product.name} ${action} wishlist`;
    
    // Create a temporary announcement element for screen readers
    this.announceToScreenReader(message);
  }

  /**
   * Handle keyboard events for wishlist button
   */
  onWishlistKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleWishlist(event);
    }
  }

  /**
   * Announce message to screen readers
   */
  private announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
} 