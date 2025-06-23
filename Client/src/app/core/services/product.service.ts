import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of, timer } from 'rxjs';
import { map, catchError, tap, retry, retryWhen, delayWhen, take, shareReplay } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';
import { ErrorHandlingService, AppError } from './error-handling.service';
import { LoadingService } from './loading.service';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  sortBy?: 'name' | 'price' | 'rating' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductSearchParams {
  query?: string;
  filters?: ProductFilters;
  page?: number;
  limit?: number;
}

export interface ProductResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.api.baseUrl}${environment.api.endpoints.products}`;
  private readonly RETRY_COUNT = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly CACHE_TIME = 5 * 60 * 1000; // 5 minutes

  private productsSubject = new BehaviorSubject<Product[]>([]);
  private cache = new Map<string, { data: any; timestamp: number }>();

  // Mock data for development (remove when backend is ready)
  private mockProducts: Product[] = [];

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlingService,
    private loadingService: LoadingService
  ) {
    this.initializeMockData();
  }

  // Public observables
  get products$(): Observable<Product[]> {
    return this.productsSubject.asObservable();
  }

  /**
   * Get all products with optional filtering and pagination
   */
  getProducts(params?: ProductSearchParams): Observable<Product[]> {
    const cacheKey = `products_${JSON.stringify(params)}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cachedData = this.cache.get(cacheKey)!.data;
      this.productsSubject.next(cachedData);
      return of(cachedData);
    }

    const loadingKey = 'getProducts';
    
    // For now, return mock data. Replace with HTTP call when backend is ready
    const filteredProducts = this.applyFiltersToMockData(this.mockProducts, params);
    
    return this.loadingService.withLoading(
      loadingKey,
      of(filteredProducts).pipe(
        tap((products) => {
          this.productsSubject.next(products);
          this.setCache(cacheKey, products);
        }),
        shareReplay(1)
      )
    );

    // Future HTTP implementation:
    /*
    let httpParams = new HttpParams();
    if (params?.query) httpParams = httpParams.set('q', params.query);
    if (params?.filters?.category) httpParams = httpParams.set('category', params.filters.category);
    if (params?.filters?.minPrice) httpParams = httpParams.set('minPrice', params.filters.minPrice.toString());
    if (params?.filters?.maxPrice) httpParams = httpParams.set('maxPrice', params.filters.maxPrice.toString());
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.loadingService.withLoading(
      loadingKey,
      this.http.get<ProductResponse>(this.apiUrl, { params: httpParams }).pipe(
        map(response => response.products),
        tap((products) => {
          this.productsSubject.next(products);
          this.setCache(cacheKey, products);
        }),
        retryWhen(errors => this.createRetryStrategy(errors)),
        catchError((error: HttpErrorResponse) => this.errorHandler.handleHttpError(error)),
        shareReplay(1)
      )
    );
    */
  }

  /**
   * Get a single product by ID with type safety
   */
  getProductById(id: number): Observable<Product | null> {
    if (!this.isValidId(id)) {
      const error: AppError = {
        code: 'INVALID_INPUT',
        message: 'Product ID must be a positive number',
        timestamp: new Date()
      };
      return throwError(() => error);
    }

    const cacheKey = `product_${id}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }

    const loadingKey = `getProduct_${id}`;

    // Mock implementation
    const product = this.mockProducts.find(p => p.id === id) || null;
    
    return this.loadingService.withLoading(
      loadingKey,
      of(product).pipe(
        tap((product) => {
          if (product) {
            this.setCache(cacheKey, product);
          }
        }),
        catchError((error) => {
          const appError: AppError = {
            code: 'PRODUCT_NOT_FOUND',
            message: `Product with ID ${id} not found`,
            details: { productId: id },
            timestamp: new Date()
          };
          return throwError(() => appError);
        }),
        shareReplay(1)
      )
    );

    // Future HTTP implementation:
    /*
    return this.loadingService.withLoading(
      loadingKey,
      this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
        tap((product) => this.setCache(cacheKey, product)),
        retryWhen(errors => this.createRetryStrategy(errors)),
        catchError((error: HttpErrorResponse) => this.errorHandler.handleHttpError(error)),
        shareReplay(1)
      )
    );
    */
  }

  /**
   * Get products by category with validation
   */
  getProductsByCategory(category: string): Observable<Product[]> {
    if (!this.isValidCategory(category)) {
      const error: AppError = {
        code: 'INVALID_CATEGORY',
        message: 'Category name cannot be empty',
        timestamp: new Date()
      };
      return throwError(() => error);
    }

    const cacheKey = `category_${category.toLowerCase()}`;
    
    if (this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }

    const loadingKey = `getProductsByCategory_${category}`;
    const filteredProducts = this.mockProducts.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );

    return this.loadingService.withLoading(
      loadingKey,
      of(filteredProducts).pipe(
        tap((products) => this.setCache(cacheKey, products)),
        shareReplay(1)
      )
    );

    // Future HTTP implementation:
    /*
    return this.loadingService.withLoading(
      loadingKey,
      this.http.get<Product[]>(`${this.apiUrl}/category/${encodeURIComponent(category)}`).pipe(
        tap((products) => this.setCache(cacheKey, products)),
        retryWhen(errors => this.createRetryStrategy(errors)),
        catchError((error: HttpErrorResponse) => this.errorHandler.handleHttpError(error)),
        shareReplay(1)
      )
    );
    */
  }

  /**
   * Search products with enhanced validation and filtering
   */
  searchProducts(query: string, filters?: ProductFilters): Observable<Product[]> {
    if (!this.isValidSearchQuery(query)) {
      const error: AppError = {
        code: 'INVALID_SEARCH_QUERY',
        message: 'Search query must be at least 2 characters long',
        timestamp: new Date()
      };
      return throwError(() => error);
    }

    const cacheKey = `search_${query}_${JSON.stringify(filters)}`;
    
    if (this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }

    const loadingKey = `searchProducts_${query}`;
    const searchResults = this.performMockSearch(query, filters);

    return this.loadingService.withLoading(
      loadingKey,
      of(searchResults).pipe(
        tap((products) => this.setCache(cacheKey, products)),
        shareReplay(1)
      )
    );

    // Future HTTP implementation:
    /*
    let params = new HttpParams().set('q', query);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.loadingService.withLoading(
      loadingKey,
      this.http.get<Product[]>(`${this.apiUrl}/search`, { params }).pipe(
        tap((products) => this.setCache(cacheKey, products)),
        retryWhen(errors => this.createRetryStrategy(errors)),
        catchError((error: HttpErrorResponse) => this.errorHandler.handleHttpError(error)),
        shareReplay(1)
      )
    );
    */
  }

  /**
   * Get related products for a given product
   */
  getRelatedProducts(productId: number, limit: number = 4): Observable<Product[]> {
    if (!this.isValidId(productId)) {
      return of([]);
    }

    const product = this.mockProducts.find(p => p.id === productId);
    if (!product) {
      return of([]);
    }

    // Find products in the same category, excluding the current product
    const relatedProducts = this.mockProducts
      .filter(p => p.id !== productId && p.category === product.category)
      .slice(0, limit);

    return of(relatedProducts);
  }

  /**
   * Get product categories
   */
  getCategories(): Observable<string[]> {
    const categories = [...new Set(this.mockProducts.map(p => p.category))];
    return of(categories);
  }

  /**
   * Clear cache and refresh data
   */
  refreshProducts(): Observable<Product[]> {
    this.clearCache();
    return this.getProducts();
  }

  // Utility methods with improved type safety
  formatPrice(price: number | undefined | null): string {
    if (typeof price !== 'number' || isNaN(price)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  isInStock(product: Product | null | undefined): boolean {
    return product?.inStock ?? false;
  }

  getStockStatus(product: Product | null | undefined): string {
    return this.isInStock(product) ? 'In Stock' : 'Out of Stock';
  }

  calculateDiscount(product: Product): number {
    if (!product.originalPrice || product.originalPrice <= product.price) {
      return 0;
    }
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }

  // Private helper methods
  private isValidId(id: any): id is number {
    return typeof id === 'number' && id > 0 && Number.isInteger(id);
  }

  private isValidCategory(category: any): category is string {
    return typeof category === 'string' && category.trim().length > 0;
  }

  private isValidSearchQuery(query: any): query is string {
    return typeof query === 'string' && query.trim().length >= 2;
  }

  private createRetryStrategy(errors: Observable<any>) {
    return errors.pipe(
      retryWhen(errors => 
        errors.pipe(
          delayWhen(() => timer(this.RETRY_DELAY)),
          take(this.RETRY_COUNT)
        )
      )
    );
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_TIME;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  private applyFiltersToMockData(products: Product[], params?: ProductSearchParams): Product[] {
    let filtered = [...products];

    if (params?.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    if (params?.filters) {
      const { category, minPrice, maxPrice, inStock, rating, sortBy, sortOrder } = params.filters;

      if (category) {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }

      if (typeof minPrice === 'number') {
        filtered = filtered.filter(p => p.price >= minPrice);
      }

      if (typeof maxPrice === 'number') {
        filtered = filtered.filter(p => p.price <= maxPrice);
      }

      if (typeof inStock === 'boolean') {
        filtered = filtered.filter(p => p.inStock === inStock);
      }

      if (typeof rating === 'number') {
        filtered = filtered.filter(p => (p.rating || 0) >= rating);
      }

      // Apply sorting
      if (sortBy) {
        filtered.sort((a, b) => {
          let comparison = 0;
          
          switch (sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'price':
              comparison = a.price - b.price;
              break;
            case 'rating':
              comparison = (a.rating || 0) - (b.rating || 0);
              break;
            case 'newest':
              comparison = a.id - b.id; // Assuming higher ID means newer
              break;
          }

          return sortOrder === 'desc' ? -comparison : comparison;
        });
      }
    }

    return filtered;
  }

  private performMockSearch(query: string, filters?: ProductFilters): Product[] {
    const searchQuery = query.toLowerCase();
    let results = this.mockProducts.filter(p => 
      p.name.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery)
    );

    if (filters) {
      results = this.applyFiltersToMockData(results, { filters });
    }

    return results;
  }

  private initializeMockData(): void {
    // Initialize with Fashion Forward products - focused on fashion and style
    this.mockProducts = [
      // Women's Clothing
      {
        id: 1,
        name: 'Elegant Summer Dress',
        description: 'Flowing midi dress perfect for summer occasions. Features a flattering A-line silhouette with delicate floral print and comfortable cotton blend fabric.',
        price: 89.99,
        originalPrice: 119.99,
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=600&fit=crop',
        category: 'Clothing',
        inStock: true,
        rating: 4.8
      },
      {
        id: 2,
        name: 'Chic Blazer Jacket',
        description: 'Sophisticated blazer that transitions from office to evening. Tailored fit with premium fabric and classic lapels for a polished look.',
        price: 159.99,
        originalPrice: 199.99,
        imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop',
        category: 'Clothing',
        inStock: true,
        rating: 4.6
      },
      {
        id: 3,
        name: 'High-Waisted Skinny Jeans',
        description: 'Premium denim jeans with a flattering high-waisted cut. Made from stretch denim for comfort and movement while maintaining shape.',
        price: 79.99,
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop',
        category: 'Clothing',
        inStock: true,
        rating: 4.7
      },
      {
        id: 4,
        name: 'Silk Blouse',
        description: 'Luxurious silk blouse with elegant draping. Perfect for professional settings or special occasions. Available in classic colors.',
        price: 129.99,
        imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop',
        category: 'Clothing',
        inStock: true,
        rating: 4.9
      },
      {
        id: 5,
        name: 'Cashmere Sweater',
        description: 'Ultra-soft cashmere sweater in a relaxed fit. Perfect for layering or wearing alone. Timeless design that never goes out of style.',
        price: 189.99,
        originalPrice: 249.99,
        imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=600&fit=crop',
        category: 'Clothing',
        inStock: false,
        rating: 4.8
      },
      {
        id: 6,
        name: 'Little Black Dress',
        description: 'The perfect LBD for any occasion. Classic fit-and-flare silhouette with subtle details. A wardrobe essential every woman needs.',
        price: 119.99,
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop',
        category: 'Clothing',
        inStock: true,
        rating: 4.7
      },
      
      // Men's Clothing
      {
        id: 7,
        name: 'Classic Oxford Shirt',
        description: 'Timeless button-down shirt in premium cotton. Perfect for business or casual wear. Crisp collar and tailored fit for a sharp look.',
        price: 69.99,
        imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=600&fit=crop',
        category: 'Clothing',
        inStock: true,
        rating: 4.5
      },
      {
        id: 8,
        name: 'Tailored Suit Jacket',
        description: 'Modern fit suit jacket in premium wool blend. Perfect for business meetings or formal events. Classic navy color with subtle texture.',
        price: 299.99,
        originalPrice: 399.99,
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=600&fit=crop',
        category: 'Clothing',
        inStock: true,
        rating: 4.8
      },
      {
        id: 9,
        name: 'Casual Chinos',
        description: 'Versatile chino pants in a modern slim fit. Made from premium cotton twill for comfort and durability. Perfect for weekend or smart-casual looks.',
        price: 59.99,
        imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=600&fit=crop',
        category: 'Clothing',
        inStock: true,
        rating: 4.4
      },
      {
        id: 10,
        name: 'Merino Wool Sweater',
        description: 'Premium merino wool pullover with a contemporary fit. Soft, breathable, and naturally odor-resistant. Perfect for layering.',
        price: 149.99,
        imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=600&fit=crop',
        category: 'Clothing',
        inStock: true,
        rating: 4.6
      },
      
      // Shoes
      {
        id: 11,
        name: 'Classic Leather Heels',
        description: 'Elegant pointed-toe heels in genuine leather. 3-inch heel height perfect for all-day comfort. Essential for professional and formal wear.',
        price: 139.99,
        imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=600&fit=crop',
        category: 'Shoes',
        inStock: true,
        rating: 4.5
      },
      {
        id: 12,
        name: 'Luxury Sneakers',
        description: 'Premium white leather sneakers with minimalist design. Comfortable for all-day wear while maintaining a sophisticated look.',
        price: 189.99,
        originalPrice: 229.99,
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=600&fit=crop',
        category: 'Shoes',
        inStock: true,
        rating: 4.7
      },
      {
        id: 13,
        name: 'Oxford Dress Shoes',
        description: 'Classic men\'s oxford shoes in premium leather. Traditional craftsmanship meets modern comfort. Perfect for business and formal occasions.',
        price: 199.99,
        imageUrl: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&h=600&fit=crop',
        category: 'Shoes',
        inStock: false,
        rating: 4.8
      },
      {
        id: 14,
        name: 'Ankle Boots',
        description: 'Stylish ankle boots with a block heel. Versatile design that pairs well with jeans, dresses, or skirts. Premium leather construction.',
        price: 159.99,
        imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e8b6d13bc0?w=400&h=600&fit=crop',
        category: 'Shoes',
        inStock: true,
        rating: 4.6
      },
      
      // Accessories
      {
        id: 15,
        name: 'Designer Handbag',
        description: 'Elegant leather handbag with gold-tone hardware. Spacious interior with multiple compartments. Perfect for work or special occasions.',
        price: 249.99,
        originalPrice: 319.99,
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=600&fit=crop',
        category: 'Accessories',
        inStock: true,
        rating: 4.9
      },
      {
        id: 16,
        name: 'Silk Scarf',
        description: 'Luxurious silk scarf with artistic print. Can be worn around the neck, as a headband, or tied to a handbag for a pop of color.',
        price: 79.99,
        imageUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400&h=600&fit=crop',
        category: 'Accessories',
        inStock: true,
        rating: 4.4
      },
      {
        id: 17,
        name: 'Statement Necklace',
        description: 'Bold statement necklace with geometric design. Gold-plated finish that adds instant glamour to any outfit. Perfect for evening wear.',
        price: 89.99,
        imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=600&fit=crop',
        category: 'Accessories',
        inStock: true,
        rating: 4.5
      },
      {
        id: 18,
        name: 'Leather Watch',
        description: 'Classic timepiece with leather strap and minimalist face. Precision movement with water resistance. Suitable for both casual and formal wear.',
        price: 199.99,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=600&fit=crop',
        category: 'Accessories',
        inStock: true,
        rating: 4.7
      },
      {
        id: 19,
        name: 'Designer Sunglasses',
        description: 'Trendy oversized sunglasses with UV protection. Classic frame design that complements any face shape. Comes with protective case.',
        price: 129.99,
        originalPrice: 159.99,
        imageUrl: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&h=600&fit=crop',
        category: 'Accessories',
        inStock: true,
        rating: 4.6
      },
      {
        id: 20,
        name: 'Leather Belt',
        description: 'Premium leather belt with polished buckle. Versatile design that works with both casual and formal outfits. Available in multiple colors.',
        price: 59.99,
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=600&fit=crop',
        category: 'Accessories',
        inStock: true,
        rating: 4.3
      }
    ];
  }
}
