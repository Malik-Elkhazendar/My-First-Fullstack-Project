import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/product.model';
import { ImageService } from '../../../core/services/image.service';
import { WishlistService } from '../../../core/services/wishlist.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCartEvent = new EventEmitter<Product>();

  constructor(
    private imageService: ImageService,
    private wishlistService: WishlistService
  ) {}

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
   * Adds the product to the cart
   */
  addToCart(product: Product): void {
    this.addToCartEvent.emit(product);
  }

  /**
   * Checks if product is in wishlist
   */
  isInWishlist(): boolean {
    return this.wishlistService.isInWishlist(this.product.id);
  }

  /**
   * Toggles product in wishlist
   */
  toggleWishlist(): void {
    this.wishlistService.toggleWishlist(this.product);
  }
} 