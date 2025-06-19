import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { WishlistService } from './core/services/wishlist.service';
import { User } from './core/models/user.model';
import { UserMenuComponent } from './shared/components/user-menu/user-menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    UserMenuComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Fashion Forward';
  currentUser: User | null = null;
  cartItemCount = 0;
  wishlistItemCount = 0;
  mobileMenuOpen = false;
  searchTerm = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    // Subscribe to cart changes
    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
      })
    );

    // Subscribe to wishlist changes
    this.subscriptions.push(
      this.wishlistService.getWishlistItems().subscribe(items => {
        this.wishlistItemCount = items.length;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Navigation methods
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  // Search functionality
  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/products'], { 
        queryParams: { search: this.searchTerm.trim() } 
      });
      this.closeMobileMenu();
    }
  }

  // User methods
  getUserInitials(): string {
    if (!this.currentUser) return '';
    const firstInitial = this.currentUser.firstName?.charAt(0) || '';
    const lastInitial = this.currentUser.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }

  // User menu event handlers
  onUserMenuClosed(): void {
    // Handle user menu closed event if needed
  }

  onLogoutClicked(): void {
    // Handle logout from user menu
    this.closeMobileMenu();
  }
}
