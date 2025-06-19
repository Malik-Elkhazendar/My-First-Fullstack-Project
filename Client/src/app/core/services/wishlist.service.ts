import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { WishlistItem, Wishlist } from '../models/wishlist.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistItems: WishlistItem[] = [];
  private wishlistSubject = new BehaviorSubject<WishlistItem[]>([]);
  private readonly STORAGE_KEY = 'wishlist';

  constructor() {
    // Load wishlist from localStorage when service is initialized
    this.loadWishlist();
  }

  /**
   * Get wishlist items as an observable
   */
  getWishlistItems(): Observable<WishlistItem[]> {
    return this.wishlistSubject.asObservable();
  }

  /**
   * Get current wishlist items value
   */
  getCurrentWishlist(): WishlistItem[] {
    return [...this.wishlistItems];
  }

  /**
   * Get wishlist summary
   */
  getWishlistSummary(): Wishlist {
    return {
      items: [...this.wishlistItems],
      totalItems: this.wishlistItems.length
    };
  }

  /**
   * Add product to wishlist
   */
  addToWishlist(product: Product): boolean {
    // Check if product already exists in wishlist
    const existingItem = this.wishlistItems.find(item => item.product.id === product.id);

    if (existingItem) {
      // Product already in wishlist, return false to indicate no change
      return false;
    }

    // Create new wishlist item
    const newItem: WishlistItem = {
      id: this.generateId(),
      product: { ...product }, // Create a copy to avoid reference issues
      dateAdded: new Date()
    };

    // Add to wishlist
    this.wishlistItems.push(newItem);

    // Update wishlist subject and save to localStorage
    this.updateWishlist();
    return true;
  }

  /**
   * Remove product from wishlist
   */
  removeFromWishlist(productId: number): boolean {
    const initialLength = this.wishlistItems.length;
    this.wishlistItems = this.wishlistItems.filter(item => item.product.id !== productId);
    
    if (this.wishlistItems.length !== initialLength) {
      this.updateWishlist();
      return true;
    }
    return false;
  }

  /**
   * Check if product is in wishlist
   */
  isInWishlist(productId: number): boolean {
    return this.wishlistItems.some(item => item.product.id === productId);
  }

  /**
   * Toggle product in wishlist (add if not present, remove if present)
   */
  toggleWishlist(product: Product): boolean {
    if (this.isInWishlist(product.id)) {
      this.removeFromWishlist(product.id);
      return false; // Removed from wishlist
    } else {
      this.addToWishlist(product);
      return true; // Added to wishlist
    }
  }

  /**
   * Clear entire wishlist
   */
  clearWishlist(): void {
    this.wishlistItems = [];
    this.updateWishlist();
  }

  /**
   * Get total number of items in wishlist
   */
  getWishlistItemCount(): number {
    return this.wishlistItems.length;
  }

  /**
   * Get wishlist items sorted by date added (newest first)
   */
  getWishlistItemsSorted(): WishlistItem[] {
    return [...this.wishlistItems].sort((a, b) => 
      new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );
  }

  /**
   * Move all wishlist items to cart (requires cart service injection)
   */
  moveAllToCart(): WishlistItem[] {
    const itemsToMove = [...this.wishlistItems];
    this.clearWishlist();
    return itemsToMove;
  }

  /**
   * Get wishlist items by category
   */
  getWishlistItemsByCategory(category: string): WishlistItem[] {
    return this.wishlistItems.filter(item => 
      item.product.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Private method to update wishlist subject and save to localStorage
   */
  private updateWishlist(): void {
    this.wishlistSubject.next([...this.wishlistItems]);
    this.saveWishlist();
  }

  /**
   * Save wishlist to localStorage
   */
  private saveWishlist(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.wishlistItems));
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error);
    }
  }

  /**
   * Load wishlist from localStorage
   */
  private loadWishlist(): void {
    try {
      const savedWishlist = localStorage.getItem(this.STORAGE_KEY);
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);
        
        // Validate the loaded data structure
        if (Array.isArray(parsedWishlist)) {
          this.wishlistItems = parsedWishlist.map(item => ({
            ...item,
            dateAdded: new Date(item.dateAdded) // Ensure dateAdded is a Date object
          }));
          this.wishlistSubject.next([...this.wishlistItems]);
        }
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
      // If there's an error, clear the wishlist
      this.clearWishlist();
    }
  }

  /**
   * Generate unique ID for wishlist items
   */
  private generateId(): string {
    return `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 