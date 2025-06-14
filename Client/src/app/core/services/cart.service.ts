import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product } from '../models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);

  constructor() {
    // Load cart from localStorage when service is initialized
    this.loadCart();
  }

  // Get cart items as an observable
  getCartItems(): Observable<CartItem[]> {
    return this.cartSubject.asObservable();
  }

  // Get current cart items value
  getCurrentCart(): CartItem[] {
    return this.cartItems;
  }

  // Add product to cart
  addToCart(product: Product, quantity: number = 1): void {
    const existingItem = this.cartItems.find(item => item.product.id === product.id);

    if (existingItem) {
      // If product already exists in cart, update quantity
      existingItem.quantity += quantity;
    } else {
      // Otherwise add new item
      this.cartItems.push({ product, quantity });
    }

    // Update cart subject and save to localStorage
    this.updateCart();
  }

  // Update quantity of product in cart
  updateQuantity(productId: number, quantity: number): void {
    const item = this.cartItems.find(item => item.product.id === productId);

    if (item) {
      item.quantity = quantity;
      this.updateCart();
    }
  }

  // Remove product from cart
  removeFromCart(productId: number): void {
    this.cartItems = this.cartItems.filter(item => item.product.id !== productId);
    this.updateCart();
  }

  // Clear entire cart
  clearCart(): void {
    this.cartItems = [];
    this.updateCart();
  }

  // Get total number of items in cart
  getCartItemCount(): number {
    return this.cartItems.reduce((count, item) => count + item.quantity, 0);
  }

  // Get cart total price
  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  // Private method to update cart subject and save to localStorage
  private updateCart(): void {
    this.cartSubject.next([...this.cartItems]);
    this.saveCart();
  }

  // Save cart to localStorage
  private saveCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
  }

  // Load cart from localStorage
  private loadCart(): void {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        this.cartItems = JSON.parse(savedCart);
        this.cartSubject.next([...this.cartItems]);
      } catch (e) {
        console.error('Error parsing cart from localStorage', e);
        // If there's an error, clear the cart
        this.clearCart();
      }
    }
  }
} 