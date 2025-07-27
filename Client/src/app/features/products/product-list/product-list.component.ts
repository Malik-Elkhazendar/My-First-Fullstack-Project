import { Component, OnInit, HostListener, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, Subscription, debounceTime, distinctUntilChanged, catchError, of, takeUntil } from 'rxjs';

import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ErrorHandlingService, AppError } from '../../../core/services/error-handling.service';
import { LoadingService } from '../../../core/services/loading.service';
import { APP_CONSTANTS } from '../../../shared/constants/app.constants';

interface LoadingStates {
  products: boolean;
  addingToCart: { [key: number]: boolean };
  addingToWishlist: { [key: number]: boolean };
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSliderModule,
    MatRadioModule,
    MatDividerModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatChipsModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = ['All', 'Clothing', 'Shoes', 'Accessories'];
  
  // UI State with proper typing
  loading: LoadingStates = {
    products: false,
    addingToCart: {},
    addingToWishlist: {}
  };
  error: AppError | null = null;
  retryAttempts = 0;
  readonly MAX_RETRY_ATTEMPTS = 3;
  
  // Search and filter state
  searchTerm = '';
  searchQuery = ''; // For template binding
  selectedCategory = 'All';
  selectedRating: number | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  showAdvancedFilters = false;
  isSortMenuOpen = false;
  filterMode: 'basic' | 'advanced' = 'basic';
  showInStockOnly = false;
  showOutOfStockOnly = false;

  // Mobile filter state
  showMobileFilters = false;
  showDesktopFilters = true;
  isMobile = false;

  // Current category from route
  currentCategory = '';

  // Advanced filter properties with type safety
  priceRange: { min: number; max: number } = {
    min: 0,
    max: 2000
  };
  minRating = 0;
  stockFilter: 'all' | 'inStock' | 'outOfStock' = 'all';
  sortBy: 'name' | 'price' | 'rating' | 'newest' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Reactive programming
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private filterSubject = new Subject<void>();
  private subscriptions: Subscription[] = [];

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private errorHandlingService: ErrorHandlingService,
    private loadingService: LoadingService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.setupSearchStream();
    this.setupFilterStream();
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.isSortMenuOpen = false;
    }
  }

  // Handle escape key to close dropdown
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.isSortMenuOpen = false;
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadInitialData();
    this.subscribeToRouteParams();
    this.initializeFilterState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showMobileFilters) {
      this.closeMobileFilters();
    }
  }

  // Screen size detection
  private checkScreenSize(): void {
    const width = window.innerWidth;
    const wasMobile = this.isMobile;
    this.isMobile = width < 768;
    
    if (this.isMobile !== wasMobile) {
      // Reset filter states when switching between mobile/desktop
      if (this.isMobile) {
        this.showDesktopFilters = false;
        this.showMobileFilters = false;
      } else {
        this.showDesktopFilters = true;
        this.showMobileFilters = false;
      }
    }
  }

  // Mobile filter controls
  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
    if (this.showMobileFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileFilters(): void {
    this.showMobileFilters = false;
    document.body.style.overflow = '';
  }

  // Desktop filter controls
  toggleDesktopFilters(): void {
    this.showDesktopFilters = !this.showDesktopFilters;
    // Persist state in localStorage for better UX
    localStorage.setItem('desktopFiltersVisible', JSON.stringify(this.showDesktopFilters));
  }

  // Initialize filter state from localStorage
  private initializeFilterState(): void {
    const savedState = localStorage.getItem('desktopFiltersVisible');
    if (savedState !== null) {
      this.showDesktopFilters = JSON.parse(savedState);
    }
  }

  // Filter count for mobile badge
  getActiveFilterCount(): number {
    let count = 0;
    
    if (this.searchQuery && this.searchQuery.trim()) count++;
    if (this.selectedCategory && this.selectedCategory !== 'All') count++;
    if (this.priceRange.min > 0 || this.priceRange.max < 2000) count++;
    if (this.showInStockOnly) count++;
    if (this.showOutOfStockOnly) count++;
    if (this.selectedRating) count++;
    
    return count;
  }

  // Clear all filters
  clearAllFilters(): void {
    this.searchQuery = '';
    this.searchTerm = '';
    this.selectedCategory = 'All';
    this.priceRange = { min: 0, max: 2000 };
    this.showInStockOnly = false;
    this.showOutOfStockOnly = false;
    this.selectedRating = null;
    this.minRating = 0;
    this.sortBy = 'name';
    
    this.applyFilters();
    this.closeMobileFilters();
  }

  // Setup reactive search stream
  private setupSearchStream(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.applyFilters();
    });
  }

  // Setup reactive filter stream
  private setupFilterStream(): void {
    this.filterSubject.pipe(
      debounceTime(100),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  // Load initial data
  private loadInitialData(): void {
    this.setLoading('products', true);
    this.error = null;

    this.productService.getProducts().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading products:', error);
        this.error = this.errorHandlingService.handleError(error);
        return of([]);
      })
    ).subscribe({
      next: (products) => {
        this.products = products;
        this.extractCategories();
        this.applyFilters();
        this.setLoading('products', false);
      },
      error: (error) => {
        this.setLoading('products', false);
        this.error = this.errorHandlingService.handleError(error);
      }
    });
  }

  // Extract unique categories from products
  private extractCategories(): void {
    const uniqueCategories = [...new Set(this.products.map(p => p.category))];
    this.categories = ['All', ...uniqueCategories.sort()];
  }

  // Subscribe to route parameters
  private subscribeToRouteParams(): void {
    const routeSub = this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['category'] && params['category'] !== this.selectedCategory) {
        this.selectedCategory = params['category'];
        this.applyFilters();
      }
      if (params['search'] && params['search'] !== this.searchQuery) {
        this.searchQuery = params['search'];
        this.searchTerm = params['search'];
        this.applyFilters();
      }
    });
    
    this.subscriptions.push(routeSub);
  }

  // Apply all active filters
  private applyFilters(): void {
    let filtered = [...this.products];

    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === this.selectedCategory.toLowerCase()
      );
    }

    // Apply price range filter
    filtered = filtered.filter(product =>
      product.price >= this.priceRange.min && product.price <= this.priceRange.max
    );

    // Apply stock filters
    if (this.showInStockOnly) {
      filtered = filtered.filter(product => product.inStock);
    }
    if (this.showOutOfStockOnly) {
      filtered = filtered.filter(product => !product.inStock);
    }

    // Apply rating filter
    if (this.selectedRating) {
      filtered = filtered.filter(product => product.rating >= this.selectedRating!);
    }

    // Apply sorting
    this.applySorting(filtered);

    this.filteredProducts = filtered;
  }

  // Apply sorting to filtered products
  private applySorting(products: Product[]): void {
    switch (this.sortBy) {
      case 'name':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        // Assuming products are already sorted by newest
        break;
      default:
        break;
    }
  }

  // Event handlers
  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onCategoryChange(): void {
    this.filterSubject.next();
  }

  onPriceInputChange(type: 'min' | 'max', event: any): void {
    const value = parseInt(event.target.value) || 0;
    if (type === 'min') {
      this.priceRange.min = Math.max(0, Math.min(value, this.priceRange.max - 1));
    } else {
      this.priceRange.max = Math.max(this.priceRange.min + 1, Math.min(value, 2000));
    }
    this.filterSubject.next();
  }

  onStockFilterChange(): void {
    // Ensure mutual exclusivity
    if (this.showInStockOnly && this.showOutOfStockOnly) {
      this.showOutOfStockOnly = false;
    }
    this.filterSubject.next();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // View mode handling
  onViewModeChange(): void {
    // Trigger change detection and apply view mode specific logic
    if (this.viewMode === 'list') {
      console.log('Switching to list view');
    } else {
      console.log('Switching to grid view');
    }
  }

  // Product actions
  viewProductDetails(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  addToCart(product: Product): void {
    if (!product.inStock || this.loading.addingToCart[product.id]) {
      return;
    }

    this.setLoading('addingToCart', true, product.id);

    try {
      this.cartService.addToCart(product, 1);

      this.snackBar.open(
        `${product.name} added to cart`,
        'View Cart',
        {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        }
      ).onAction().subscribe(() => {
        this.router.navigate(['/cart']);
      });

    } catch (error) {
      this.snackBar.open(
        'Failed to add product to cart',
        'Close',
        {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        }
      );
    } finally {
      this.setLoading('addingToCart', false, product.id);
    }
  }

  toggleWishlist(product: Product): void {
    if (this.loading.addingToWishlist[product.id]) {
      return;
    }

    this.setLoading('addingToWishlist', true, product.id);

    try {
      // This would typically check if item is already in wishlist
      this.wishlistService.addToWishlist(product);

      this.snackBar.open(
        `${product.name} added to wishlist`,
        'View Wishlist',
        {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        }
      ).onAction().subscribe(() => {
        this.router.navigate(['/wishlist']);
      });

    } catch (error) {
      this.snackBar.open(
        'Failed to add product to wishlist',
        'Close',
        {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        }
      );
    } finally {
      this.setLoading('addingToWishlist', false, product.id);
    }
  }

  retryLoading(): void {
    this.loadInitialData();
  }

  // Utility methods
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  private setLoading(type: keyof LoadingStates, loading: boolean, productId?: number): void {
    if (type === 'products') {
      this.loading.products = loading;
    } else if (productId !== undefined) {
      if (loading) {
        this.loading[type][productId] = true;
      } else {
        delete this.loading[type][productId];
      }
    }
  }
}

