import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
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
import { Subject, Subscription, Observable, debounceTime, distinctUntilChanged, switchMap, catchError, of, takeUntil } from 'rxjs';

import { Product } from '../../../core/models/product.model';
import { ProductService, ProductFilters } from '../../../core/services/product.service';
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
  styleUrls: ['./product-list.component.scss']
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
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private productService: ProductService,
    private authService: AuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private errorHandler: ErrorHandlingService,
    private loadingService: LoadingService
  ) {
    this.initializeSearchHandler();
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
    this.subscribeToLoadingStates();
    this.subscribeToRouteParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
  }

  private initializeSearchHandler(): void {
    // Enhanced debounce search input to avoid excessive API calls
    this.searchSubject.pipe(
      debounceTime(APP_CONSTANTS.UI_CONFIG.SEARCH.DEBOUNCE_TIME), // Use configurable debounce time
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap(query => {
        // Show loading state
        this.loading.products = true;
        
        if (query.length > 0 && query.length < APP_CONSTANTS.UI_CONFIG.SEARCH.MIN_QUERY_LENGTH) {
          this.loading.products = false;
          return of([]);
        }
        return this.performSearch(query);
      })
    ).subscribe({
      next: (products) => {
        this.filteredProducts = products;
        this.error = null;
        this.loading.products = false;
      },
      error: (error: AppError) => {
        this.handleSearchError(error);
        this.loading.products = false;
      }
    });
  }

  private subscribeToLoadingStates(): void {
    this.subscriptions.add(
      this.loadingService.isLoading('getProducts').subscribe(
        isLoading => this.loading.products = isLoading
      )
    );
  }

  private subscribeToRouteParams(): void {
    this.subscriptions.add(
      this.route.queryParams.subscribe(params => {
        this.currentCategory = params['category'] || '';
        this.searchTerm = params['search'] || '';
        this.selectedCategory = this.currentCategory ? this.capitalizeFirst(this.currentCategory) : 'All';
        this.loadProducts();
      })
    );
  }

  // Category display methods with null safety
  getCategoryDisplayName(): string {
    if (this.currentCategory) {
      return this.formatCategoryName(this.currentCategory);
    }
    return 'All Products';
  }

  getCategoryDescription(): string {
    const descriptions: Record<string, string> = {
      'clothing': 'Discover our curated collection of premium clothing for modern fashion enthusiasts.',
      'shoes': 'Step into luxury with our handpicked selection of designer footwear.',
      'accessories': 'Complete your style with our exclusive range of fashion accessories.',
      'all': 'Browse our complete collection of high-quality fashion items.',
      'new-arrivals': 'Discover the latest additions to our collection.',
      'sale': 'Don\'t miss out on these amazing deals and discounts.'
    };
    
    return descriptions[this.currentCategory.toLowerCase()] || 'Browse our complete collection of high-quality products.';
  }

  private formatCategoryName(category: string): string {
    if (!category || typeof category !== 'string') {
      return 'All Products';
    }
    
    return category
      .split('-')
      .map(word => this.capitalizeFirst(word))
      .join(' ');
  }

  private capitalizeFirst(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Enhanced sort functionality with error handling
  setSortOption(sortBy: string, sortOrder: string): void {
    try {
      this.sortBy = sortBy as 'name' | 'price' | 'rating' | 'newest';
      this.sortOrder = sortOrder as 'asc' | 'desc';
      this.isSortMenuOpen = false;
      this.applyFilters();
      
      this.errorHandler.showInfoNotification(`Sorted by ${this.getCurrentSortLabel()}`);
    } catch (error) {
      this.errorHandler.handleError(error, 'setSortOption');
    }
  }

  // Sort menu methods
  toggleSortMenu(): void {
    this.isSortMenuOpen = !this.isSortMenuOpen;
  }

  closeSortMenu(): void {
    this.isSortMenuOpen = false;
  }

  getCurrentSortLabel(): string {
    const sortLabels: Record<string, string> = {
      'name-asc': 'Name A-Z',
      'name-desc': 'Name Z-A',
      'price-asc': 'Price Low to High',
      'price-desc': 'Price High to Low',
      'rating-desc': 'Highest Rated',
      'newest-desc': 'Newest First'
    };
    
    const key = `${this.sortBy}-${this.sortOrder}`;
    return sortLabels[key] || 'Sort';
  }

  // Enhanced filter handling
  onFilterModeChange(): void {
    try {
      this.applyFilters();
      this.errorHandler.showInfoNotification(
        `Switched to ${this.filterMode} filters`
      );
    } catch (error) {
      this.errorHandler.handleError(error, 'onFilterModeChange');
    }
  }

  // Get active filters count for badge with validation
  getActiveFiltersCount(): number {
    try {
      let count = 0;
      if (this.searchTerm?.trim()) count++;
      if (this.selectedCategory !== 'All') count++;
      if (this.priceRange.min > 0 || this.priceRange.max < 2000) count++;
      if (this.minRating > 0) count++;
      if (this.stockFilter !== 'all') count++;
      return count;
    } catch (error) {
      this.errorHandler.handleError(error, 'getActiveFiltersCount');
      return 0;
    }
  }

  // Admin check with error handling
  isAdmin(): boolean {
    try {
      return this.authService.isAdmin;
    } catch (error) {
      this.errorHandler.handleError(error, 'isAdmin');
      return false;
    }
  }

  addProduct(): void {
    try {
      this.router.navigate(['/admin/products/add']);
    } catch (error) {
      this.errorHandler.handleError(error, 'addProduct');
      this.errorHandler.showErrorNotification('Unable to navigate to add product page');
    }
  }

  // Enhanced toggle methods
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onPriceRangeChange(): void {
    try {
      // Validate price range
      if (this.priceRange.min < 0) this.priceRange.min = 0;
      if (this.priceRange.max > 2000) this.priceRange.max = 2000;
      if (this.priceRange.min > this.priceRange.max) {
        this.priceRange.min = this.priceRange.max;
      }
      
      this.applyFilters();
    } catch (error) {
      this.errorHandler.handleError(error, 'onPriceRangeChange');
    }
  }

  onRatingChange(): void {
    try {
      this.selectedRating = this.minRating;
      this.applyFilters();
    } catch (error) {
      this.errorHandler.handleError(error, 'onRatingChange');
    }
  }

  onStockFilterChange(): void {
    try {
      // Update individual stock filter flags based on stockFilter value
      this.showInStockOnly = this.stockFilter === 'inStock';
      this.showOutOfStockOnly = this.stockFilter === 'outOfStock';
      this.applyFilters();
    } catch (error) {
      this.errorHandler.handleError(error, 'onStockFilterChange');
    }
  }

  onSortChange(): void {
    this.applyFilters();
  }

  // Enhanced loading with retry logic
  private loadProducts(): void {
    this.error = null;
    this.retryAttempts = 0;
    
    this.performLoadProducts();
  }

  private performLoadProducts(): void {
    const filters: ProductFilters = this.buildFilters();
    
    this.productService.getProducts({ 
      query: this.searchTerm,
      filters
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
        this.error = null;
        this.retryAttempts = 0;
      },
      error: (error: AppError) => {
        this.handleLoadError(error);
      }
    });
  }

  private buildFilters(): ProductFilters {
    return {
      category: this.selectedCategory !== 'All' ? this.selectedCategory : undefined,
      minPrice: this.priceRange.min || undefined,
      maxPrice: this.priceRange.max < 2000 ? this.priceRange.max : undefined,
      inStock: this.stockFilter === 'inStock' ? true : 
               this.stockFilter === 'outOfStock' ? false : undefined,
      rating: this.minRating || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };
  }

  private handleLoadError(error: AppError): void {
    this.error = error;
    
    if (this.errorHandler.isRetryableError(error) && this.retryAttempts < this.MAX_RETRY_ATTEMPTS) {
      this.retryAttempts++;
      this.errorHandler.showErrorNotification(
        `Failed to load products. Retrying... (${this.retryAttempts}/${this.MAX_RETRY_ATTEMPTS})`
      );
      
      // Retry after a delay
      setTimeout(() => {
        this.performLoadProducts();
      }, 2000 * this.retryAttempts);
    } else {
      this.errorHandler.showErrorNotification(
        this.errorHandler.getUserFriendlyMessage(error)
      );
    }
  }

  retryLoading(): void {
    this.loadProducts();
  }

  // Enhanced search with debouncing
  private searchTimeout?: number;
  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  private performSearch(query: string): Observable<Product[]> {
    if (!query.trim()) {
      return of(this.products);
    }
    
    return this.productService.searchProducts(query, this.buildFilters()).pipe(
      catchError((error: AppError) => {
        this.errorHandler.showErrorNotification('Search failed. Please try again.');
        return of([]);
      })
    );
  }

  private handleSearchError(error: AppError): void {
    this.error = error;
    this.errorHandler.showErrorNotification(
      'Search failed. Please check your input and try again.'
    );
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  // Enhanced filter application with error handling
  applyFilters(): void {
    try {
      let filtered = [...this.products];

      // Apply search filter
      if (this.searchTerm?.trim()) {
        const searchLower = this.searchTerm.toLowerCase();
        filtered = filtered.filter(product => 
          product?.name?.toLowerCase().includes(searchLower) ||
          product?.description?.toLowerCase().includes(searchLower)
        );
      }

      // Apply category filter
      if (this.selectedCategory && this.selectedCategory !== 'All') {
        filtered = filtered.filter(product => 
          product?.category?.toLowerCase() === this.selectedCategory.toLowerCase()
        );
      }

      // Apply price range filter
      if (this.priceRange.min > 0 || this.priceRange.max < 2000) {
        filtered = filtered.filter(product => 
          product?.price >= this.priceRange.min && 
          product?.price <= this.priceRange.max
        );
      }

      // Apply rating filter
      if (this.selectedRating && this.selectedRating > 0) {
        filtered = filtered.filter(product => 
          (product?.rating || 0) >= this.selectedRating!
        );
      }

      // Apply stock filter
      if (this.showInStockOnly) {
        filtered = filtered.filter(product => product?.inStock === true);
      }
      if (this.showOutOfStockOnly) {
        filtered = filtered.filter(product => product?.inStock === false);
      }

      // Apply sorting with null safety
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (this.sortBy) {
          case 'name':
            comparison = (a?.name || '').localeCompare(b?.name || '');
            break;
          case 'price':
            comparison = (a?.price || 0) - (b?.price || 0);
            break;
          case 'rating':
            comparison = (a?.rating || 0) - (b?.rating || 0);
            break;
          case 'newest':
            comparison = (a?.id || 0) - (b?.id || 0);
            break;
        }

        return this.sortOrder === 'desc' ? -comparison : comparison;
      });

      this.filteredProducts = filtered;
    } catch (error) {
      this.errorHandler.handleError(error, 'applyFilters');
      this.filteredProducts = this.products; // Fallback to unfiltered products
    }
  }

  // Enhanced clear filters with confirmation
  clearFilters(): void {
    try {
      this.searchTerm = '';
      this.searchQuery = '';
      this.selectedCategory = 'All';
      this.selectedRating = null;
      this.priceRange = { min: 0, max: 2000 };
      this.minRating = 0;
      this.stockFilter = 'all';
      this.showInStockOnly = false;
      this.showOutOfStockOnly = false;
      this.sortBy = 'name';
      this.sortOrder = 'asc';
      
      this.applyFilters();
      this.errorHandler.showSuccessNotification('Filters cleared');
    } catch (error) {
      this.errorHandler.handleError(error, 'clearFilters');
    }
  }

  hasActiveFilters(): boolean {
    try {
      return this.searchTerm.trim() !== '' ||
             this.selectedCategory !== 'All' ||
             this.priceRange.min > 0 ||
             this.priceRange.max < 2000 ||
             this.selectedRating !== null ||
             this.stockFilter !== 'all';
    } catch (error) {
      this.errorHandler.handleError(error, 'hasActiveFilters');
      return false;
    }
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  viewProduct(product: Product): void {
    try {
      if (!product?.id) {
        throw new Error('Invalid product data');
      }
      this.router.navigate(['/products', product.id]);
    } catch (error) {
      this.errorHandler.handleError(error, 'viewProduct');
      this.errorHandler.showErrorNotification('Unable to view product details');
    }
  }

  // Enhanced cart operations with loading states
  addToCart(product: Product): void {
    if (!product?.id) {
      this.errorHandler.showErrorNotification('Invalid product data');
      return;
    }

    if (this.loading.addingToCart[product.id]) {
      return; // Prevent duplicate operations
    }

    this.loading.addingToCart[product.id] = true;

    try {
      this.cartService.addToCart(product, 1);
      this.loading.addingToCart[product.id] = false;
      this.errorHandler.showSuccessNotification(`${product.name} added to cart!`);
    } catch (error: any) {
      this.loading.addingToCart[product.id] = false;
      this.errorHandler.handleError(error, 'addToCart');
      this.errorHandler.showErrorNotification('Failed to add product to cart');
    }
  }

  isAddingToCart(productId: number): boolean {
    return !!this.loading.addingToCart[productId];
  }

  isInWishlist(productId: number): boolean {
    try {
      return this.wishlistService.isInWishlist(productId);
    } catch (error) {
      this.errorHandler.handleError(error, 'isInWishlist');
      return false;
    }
  }

  // Enhanced wishlist operations
  addToWishlist(product: Product): void {
    if (!product?.id) {
      this.errorHandler.showErrorNotification('Invalid product data');
      return;
    }

    if (this.loading.addingToWishlist[product.id]) {
      return;
    }

    this.loading.addingToWishlist[product.id] = true;

    try {
      this.wishlistService.addToWishlist(product);
      this.loading.addingToWishlist[product.id] = false;
      this.errorHandler.showSuccessNotification(`${product.name} added to wishlist!`);
    } catch (error: any) {
      this.loading.addingToWishlist[product.id] = false;
      this.errorHandler.handleError(error, 'addToWishlist');
      this.errorHandler.showErrorNotification('Failed to add product to wishlist');
    }
  }

  // Utility methods with enhanced error handling
  trackByProductId(index: number, product: Product): number {
    return product?.id || index;
  }

  getImageUrl(imageUrl: string): string {
    try {
      if (!imageUrl) {
        return '/assets/images/products/placeholder.jpg';
      }
      
      if (imageUrl.startsWith('http')) {
        return imageUrl;
      }
      
      return `/assets/images/products/${imageUrl}`;
    } catch (error) {
      this.errorHandler.handleError(error, 'getImageUrl');
      return '/assets/images/products/placeholder.jpg';
    }
  }

  handleImageError(event: any): void {
    try {
      if (event?.target) {
        event.target.src = '/assets/images/products/placeholder.jpg';
      }
    } catch (error) {
      this.errorHandler.handleError(error, 'handleImageError');
    }
  }

  formatPrice(price: number | undefined | null): string {
    return this.productService.formatPrice(price);
  }

  isInStock(product: Product | null | undefined): boolean {
    return this.productService.isInStock(product);
  }

  getStockStatus(product: Product | null | undefined): string {
    return this.productService.getStockStatus(product);
  }

  getStockIcon(product: Product | null | undefined): string {
    return this.isInStock(product) ? 'check_circle' : 'cancel';
  }

  // Accessibility methods
  onProductKeydown(event: KeyboardEvent, product: Product): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.viewProduct(product);
    }
  }

  onFilterKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.applyFilters();
    }
  }

  // Error state helpers
  get hasError(): boolean {
    return !!this.error;
  }

  get isRetryable(): boolean {
    return this.error ? this.errorHandler.isRetryableError(this.error) : false;
  }

  get errorMessage(): string {
    return this.error ? this.errorHandler.getUserFriendlyMessage(this.error) : '';
  }
}

