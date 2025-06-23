import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, filter } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ProductService } from '../../core/services/product.service';
import { User } from '../../core/models/user.model';
import { Product } from '../../core/models/product.model';

interface SearchSuggestion {
  id: number;
  name: string;
  category: string;
  type: 'product' | 'category';
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Authentication state
  isAuthenticated = false;
  currentUser: User | null = null;

  // UI state
  isUserMenuOpen = false;
  isMobileMenuOpen = false;
  
  // Search functionality
  searchQuery = '';
  searchSuggestions: SearchSuggestion[] = [];
  selectedSuggestionIndex = -1;
  
  // Cart and wishlist counts
  cartCount = 0;
  wishlistCount = 0;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
      });

    // Subscribe to cart count
    this.cartService.getCartItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartCount = items.reduce((total, item) => total + item.quantity, 0);
      });

    // Subscribe to wishlist count
    this.wishlistService.getWishlistItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.wishlistCount = items.length;
      });

    // Close menus on route change
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.closeAllMenus();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation helpers
  isActiveRoute(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  // Search functionality
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value.trim();
    
    if (query.length >= 2) {
      this.loadSearchSuggestions(query);
    } else {
      this.searchSuggestions = [];
      this.selectedSuggestionIndex = -1;
    }
  }

  private loadSearchSuggestions(query: string): void {
    // Simulate search suggestions - in real app, this would be an API call
    this.productService.searchProducts(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        // Limit to first 5 suggestions
        this.searchSuggestions = products.slice(0, 5).map(product => ({
          id: product.id,
          name: product.name,
          category: product.category,
          type: 'product' as const
        }));
      });
  }

  performSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchQuery.trim() }
      });
      this.searchSuggestions = [];
      this.selectedSuggestionIndex = -1;
    }
  }

  selectSuggestion(suggestion: SearchSuggestion): void {
    if (suggestion.type === 'product') {
      this.router.navigate(['/products', suggestion.id]);
    } else {
      this.router.navigate(['/products'], {
        queryParams: { category: suggestion.category }
      });
    }
    this.searchSuggestions = [];
    this.selectedSuggestionIndex = -1;
    this.searchQuery = '';
  }

  onSuggestionKeydown(event: KeyboardEvent, suggestion: SearchSuggestion, index: number): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectSuggestion(suggestion);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.min(
          this.selectedSuggestionIndex + 1,
          this.searchSuggestions.length - 1
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
        break;
      case 'Escape':
        this.searchSuggestions = [];
        this.selectedSuggestionIndex = -1;
        break;
    }
  }

  // Menu management
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  private closeAllMenus(): void {
    this.isUserMenuOpen = false;
    this.isMobileMenuOpen = false;
    this.searchSuggestions = [];
    this.selectedSuggestionIndex = -1;
  }

  // Authentication actions
  logout(): void {
    this.authService.logout();
    this.closeAllMenus();
    this.router.navigate(['/']);
  }

  // Close menus when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Close user menu if clicking outside
    if (this.isUserMenuOpen && !target.closest('.relative')) {
      this.isUserMenuOpen = false;
    }
    
    // Close search suggestions if clicking outside
    if (this.searchSuggestions.length > 0 && !target.closest('.search-container')) {
      this.searchSuggestions = [];
      this.selectedSuggestionIndex = -1;
    }
  }

  // Keyboard navigation for accessibility
  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    // Close menus on Escape
    if (event.key === 'Escape') {
      this.closeAllMenus();
    }
    
    // Handle search suggestions keyboard navigation
    if (this.searchSuggestions.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.selectedSuggestionIndex = Math.min(
            this.selectedSuggestionIndex + 1,
            this.searchSuggestions.length - 1
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
          break;
        case 'Enter':
          if (this.selectedSuggestionIndex >= 0) {
            event.preventDefault();
            this.selectSuggestion(this.searchSuggestions[this.selectedSuggestionIndex]);
          }
          break;
      }
    }
  }
}
