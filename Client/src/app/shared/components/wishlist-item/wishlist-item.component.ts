import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistItem } from '../../../core/models/wishlist.model';
import { Product } from '../../../core/models/product.model';
import { ImageService } from '../../../core/services/image.service';

@Component({
  selector: 'app-wishlist-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlist-item.component.html',
  styleUrls: ['./wishlist-item.component.scss']
})
export class WishlistItemComponent {
  @Input() wishlistItem!: WishlistItem;
  @Output() removeFromWishlistEvent = new EventEmitter<number>();
  @Output() addToCartEvent = new EventEmitter<Product>();
  @Output() viewProductEvent = new EventEmitter<Product>();

  constructor(private imageService: ImageService) {}

  /**
   * Handles image loading errors by replacing with a placeholder
   */
  handleImageError(event: Event): void {
    this.imageService.handleImageError(event);
  }

  /**
   * Gets the proper image URL
   */
  getImageUrl(path: string): string {
    return this.imageService.getImageUrl(path);
  }

  /**
   * Removes the product from wishlist
   */
  removeFromWishlist(): void {
    this.removeFromWishlistEvent.emit(this.wishlistItem.product.id);
  }

  /**
   * Adds the product to cart
   */
  addToCart(): void {
    this.addToCartEvent.emit(this.wishlistItem.product);
  }

  /**
   * Views the product details
   */
  viewProduct(): void {
    this.viewProductEvent.emit(this.wishlistItem.product);
  }

  /**
   * Formats the date when item was added to wishlist
   */
  getFormattedDate(): string {
    const now = new Date();
    const addedDate = new Date(this.wishlistItem.dateAdded);
    const diffTime = Math.abs(now.getTime() - addedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Added today';
    } else if (diffDays === 2) {
      return 'Added yesterday';
    } else if (diffDays <= 7) {
      return `Added ${diffDays - 1} days ago`;
    } else {
      return addedDate.toLocaleDateString();
    }
  }

  /**
   * Gets the discount percentage if product has original price
   */
  getDiscountPercentage(): number | null {
    if (this.wishlistItem.product.originalPrice && this.wishlistItem.product.originalPrice > this.wishlistItem.product.price) {
      const discount = ((this.wishlistItem.product.originalPrice - this.wishlistItem.product.price) / this.wishlistItem.product.originalPrice) * 100;
      return Math.round(discount);
    }
    return null;
  }

  /**
   * Checks if product is on sale
   */
  isOnSale(): boolean {
    return this.getDiscountPercentage() !== null;
  }
} 