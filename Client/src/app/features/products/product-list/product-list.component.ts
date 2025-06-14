import { Component, OnInit } from '@angular/core';
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
import { MatMenuModule } from '@angular/material/menu';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

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
    MatMenuModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = ['All', 'Electronics', 'Clothing', 'Books', 'Home & Garden'];
  
  // UI State
  loading = true;
  error: string | null = null;
  searchTerm = '';
  selectedCategory = 'All';
  viewMode: 'grid' | 'list' = 'grid';
  showAdvancedFilters = false;
  addingToCart: { [key: number]: boolean } = {};

  // Current category from route
  currentCategory = '';

  // Advanced filter properties
  priceRange = {
    min: 0,
    max: 1000
  };
  minRating = 0;
  stockFilter: 'all' | 'inStock' | 'outOfStock' = 'all';
  sortBy: 'name' | 'price' | 'rating' | 'newest' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private productService: ProductService,
    private authService: AuthService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // Subscribe to route params to get category
    this.route.queryParams.subscribe(params => {
      this.currentCategory = params['category'] || '';
      this.searchTerm = params['search'] || '';
      this.selectedCategory = this.currentCategory ? this.capitalizeFirst(this.currentCategory) : 'All';
    this.loadProducts();
    });
  }

  // Category display methods
  getCategoryDisplayName(): string {
    if (this.currentCategory) {
      return this.formatCategoryName(this.currentCategory);
    }
    return 'All Products';
  }

  getCategoryDescription(): string {
    const descriptions: { [key: string]: string } = {
      'clothing': 'Explore our latest collection of stylish and comfortable clothing for every occasion.',
      'shoes': 'Step out in style with our premium collection of footwear.',
      'accessories': 'Complete your look with our curated selection of accessories.',
      'new-arrivals': 'Discover the latest additions to our collection.',
      'sale': 'Don\'t miss out on these amazing deals and discounts.',
      'electronics': 'Cutting-edge technology and gadgets for modern living.',
      'books': 'Expand your knowledge with our diverse book collection.',
      'home-garden': 'Transform your living space with our home and garden essentials.'
    };
    
    return descriptions[this.currentCategory] || 'Browse our complete collection of high-quality products.';
  }

  private formatCategoryName(category: string): string {
    return category
      .split('-')
      .map(word => this.capitalizeFirst(word))
      .join(' ');
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Sort functionality
  setSortOption(sortBy: string, sortOrder: string): void {
    this.sortBy = sortBy as 'name' | 'price' | 'rating' | 'newest';
    this.sortOrder = sortOrder as 'asc' | 'desc';
    this.applyFilters();
  }

  // Admin role checking
  isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  // Navigate to add product page (admin only)
  addProduct(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin/products/add']);
    } else {
      this.snackBar.open('Access denied. Admin privileges required.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // Toggle advanced filters panel
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  // Advanced filter methods
  onPriceRangeChange(): void {
    this.applyFilters();
  }

  onRatingChange(): void {
    this.applyFilters();
  }

  onStockFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  // Data Loading
  private loadProducts(): void {
    this.loading = true;
    this.error = null;

    // Simulate loading delay for better UX
    setTimeout(() => {
      try {
        this.productService.getProducts().subscribe({
          next: (products) => {
            this.products = products;
            this.applyFilters();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading products:', error);
            this.error = 'Failed to load products. Please try again.';
            this.loading = false;
          }
        });
      } catch (error) {
        console.error('Error loading products:', error);
        this.error = 'Failed to load products. Please try again.';
        this.loading = false;
      }
    }, 1000);
  }

  // Retry loading products
  retryLoading(): void {
    this.loadProducts();
  }

  // Search and Filter Methods
  onSearchChange(): void {
    this.applyFilters();
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.products];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter from route
    if (this.currentCategory && this.currentCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === this.currentCategory.toLowerCase() ||
        (this.currentCategory === 'new-arrivals' && Math.random() > 0.5) || // Mock new arrivals
        (this.currentCategory === 'sale' && product.originalPrice && product.originalPrice > product.price)
      );
    }

    // Apply price range filter
    filtered = filtered.filter(product => 
      product.price >= this.priceRange.min && product.price <= this.priceRange.max
    );

    // Apply rating filter
    if (this.minRating > 0) {
      filtered = filtered.filter(product => product.rating >= this.minRating);
    }

    // Apply stock filter
    if (this.stockFilter === 'inStock') {
      filtered = filtered.filter(product => product.inStock);
    } else if (this.stockFilter === 'outOfStock') {
      filtered = filtered.filter(product => !product.inStock);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'newest':
          // Mock newest sorting - in real app, would use creation date
          comparison = Math.random() - 0.5;
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredProducts = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'All';
    this.priceRange = { min: 0, max: 1000 };
    this.minRating = 0;
    this.stockFilter = 'all';
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.searchTerm.trim() !== '' || 
           this.selectedCategory !== 'All' ||
           this.priceRange.min > 0 ||
           this.priceRange.max < 1000 ||
           this.minRating > 0 ||
           this.stockFilter !== 'all';
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  addToCart(product: Product): void {
    if (!product.inStock) {
      this.snackBar.open('This product is currently out of stock', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.addingToCart[product.id] = true;

    // Simulate API call delay
    setTimeout(() => {
        this.cartService.addToCart(product, 1);
      this.addingToCart[product.id] = false;
      
      this.snackBar.open(`${product.name} added to cart!`, 'View Cart', {
          duration: 3000,
          panelClass: ['success-snackbar']
        }).onAction().subscribe(() => {
          this.router.navigate(['/cart']);
        });
    }, 800);
  }

  isAddingToCart(productId: number): boolean {
    return !!this.addingToCart[productId];
  }

  addToWishlist(product: Product): void {
    // Mock wishlist functionality
    this.snackBar.open(`${product.name} added to wishlist!`, 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  getImageUrl(imageUrl: string): string {
    // In a real application, this would handle image URL resolution
    // For now, return the URL as-is or provide a fallback
    if (imageUrl && imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Return placeholder or default image
    return '/assets/images/placeholder.jpg';
  }

  handleImageError(event: any): void {
    event.target.src = '/assets/images/placeholder.jpg';
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  isInStock(product: Product): boolean {
    return product.inStock;
  }

  getStockStatus(product: Product): string {
    return product.inStock ? 'In Stock' : 'Out of Stock';
  }

  getStockIcon(product: Product): string {
    return product.inStock ? 'check_circle' : 'cancel';
  }

  onProductKeydown(event: KeyboardEvent, product: Product): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.viewProduct(product);
    }
  }

  onFilterKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.toggleAdvancedFilters();
    }
  }
}
