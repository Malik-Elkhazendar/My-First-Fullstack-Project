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
  private readonly apiUrl = `${environment.apiUrl}/products`;
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
    // Initialize with Fashion Forward products - single source of truth
    this.mockProducts = [
      {
        id: 1,
        name: 'Summer Dress',
        description: 'Light and breezy summer dress perfect for warm weather. Made from high-quality cotton blend fabric that feels soft against your skin.',
        price: 79.99,
        originalPrice: 99.99,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDReOW2s-w9Y0z9VzKDH7r0HnBHs1SkCfbN-eXdgNDOveTLnx3F-Z93GwkAmgzl0fmrZ6hzJUh6D_U1TSTfW2M6bzW5UF2CXQ-NT-tUXv1_VJzO8aVOEGKi9498EbFkVhlMlopjhCGFDbZNIZUOgzHMRljL542scyHoF3Cit5dQN7quYAG7sd-qIHmh2ovNVFcZAkQunEu0FCGpc_JfEiGCE0Ij4CLFQvUMjwkHILX8OeMxaQatGbhuBGqCjaEsKxRkW-OGo6N0TDA',
        category: 'Clothing',
        inStock: true,
        rating: 4.5
      },
      {
        id: 2,
        name: 'Casual T-Shirt',
        description: 'Comfortable cotton t-shirt for everyday wear. Features a relaxed fit and classic design that goes with everything.',
        price: 24.99,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQ0l3bN4SYvgoUgpK03V7e0bPPdPO5ndEMBaxo1GJCMc6NgIFYFVU09n-GJRedwmHmWEhz3fQBzTpOMybWUTQVcLoikwLRArbZ0hZ93a46dVSA6ydAXVDWsxxIDY5q5n0kY6nTjrIsYxzytV41NLU4nZ9k-gMIwkHjWmP7gQde2bpWNINyNZLdwWuiON4NbTMyhQxUL1SFyVQrOxmxssE_q4KTWQeI6Do-VuhQfRWv2cN-gcElm-tPpPSGfCJ8sBwpdA-AGEDYu20',
        category: 'Clothing',
        inStock: true,
        rating: 4.2
      },
      {
        id: 3,
        name: 'Denim Jeans',
        description: 'Classic blue denim jeans with a modern fit. Crafted from premium denim with just the right amount of stretch for comfort.',
        price: 89.99,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWt5DsDzAiz5BPQD3M98RuLyVxGkpKYcsT9KyKtkPR5V-91Jh66duP3hhA8C_EZFau0g5eKCfrTXcjfHovh664GaOuLgg0luJiy46lOByLqjjaDlo-pIvCs5vEW71P7HnO-WOACragDBla_LZ-cYIopXQGk3qwQh6UOXM0e45TYiwfh7lSpOiDOK99KJK25SAbPtKvA2PUumQ_qiXNTBQLdg-6xR_6cqRdVYSZ6RqBsYcxvylNAICLdx4ZC9F-Bv94UgrRKGWS57g',
        category: 'Clothing',
        inStock: true,
        rating: 4.7
      },
      {
        id: 4,
        name: 'Formal Blazer',
        description: 'Professional blazer perfect for business meetings. Tailored fit with premium fabric that maintains its shape all day.',
        price: 149.99,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaW4F0dZfUkBeT6Kn87flSLeqXc0kUWV0Tq88otYyVd9OGrNVGpp066rzzNSqQ8ulLoMEpUnxDnzcV9LfHWb8fJbLpP09wtjC-oO7D8beaMkbgW5CjSmCaElccdns4LaXvBDMczOdTrNxdfM9s7gKjt9rKJhdnrvLQ8nDKey657WrAgazZk86-PxkNRHBCsQOCUpS3HdJWhWsfn7YVOPEg42CQuBxNkuue_C31XaCb-CQaC7S_A48SBYu1YIyxBznXE314dtAphvk',
        category: 'Clothing',
        inStock: false,
        rating: 4.3
      },
      {
        id: 5,
        name: 'Sports Leggings',
        description: 'High-performance leggings for your workout routine. Moisture-wicking fabric with four-way stretch for maximum comfort.',
        price: 59.99,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjk0vgQz2AU7KN43zuzAanTNwAfld5p7q9uLiRPD5ek1OqU3USUw3FPp87-XODyXyGiiaL1hntbSwf--7P8rHmN8tydWvzcjbcGMQgwCQKuu4ehelCfs0q4cleeFqYtdBO1UuS0PTGLuoOlUAnLhQ65mCRct-GaXdjU0V3oZmusjVFmKp9v9JjPwJi238YWEol8s3pEiEpJN68YfG2K9fPN_grT1o410AAXY6U2ZeHCgSa478oL-yJ8_kgU7Qo9LNwemghiKyxtbY',
        category: 'Clothing',
        inStock: true,
        rating: 4.6
      },
      {
        id: 6,
        name: 'Winter Coat',
        description: 'Warm and stylish coat for cold weather. Insulated with premium down fill and water-resistant outer shell.',
        price: 199.99,
        originalPrice: 249.99,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOuVXNMwCFR_cE5720wDXZ-3K2_eZN6tXlQt3kWmsZM2s4kRT5wiADwoNl55ts0r7zbjX3qFKN4p_WhfUFOWMpk1eJNAo4pCYeg47-vv5wdUumJVZDAy3ZIW1HFDVVRg5mZc-IOXLfYtO0ZsCbjReIYgjf703nteOMLJSj4w4LGz3bZeNOYNIE1Gt_iHMmnD4jdHLDqzRM_2srpNUxgdKEdCeHPEYa1i7t7rVVVxuC-NedZh6KcNe3ie77XVJnahLdgSitjRpsSrY',
        category: 'Clothing',
        inStock: true,
        rating: 4.8
      },
      {
        id: 7,
        name: 'Party Skirt',
        description: 'Elegant skirt perfect for special occasions. Flowing design with beautiful drape that flatters every figure.',
        price: 69.99,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHsAF2OVjHP1bexPDAf32exewaki_e2mc94ql69sasGrZrSjRPWUkhLJ8ui30iDEIXgkGRXCNvSj0tVfLOzAd8MDB9Z0j9fl8_h-iAeJZx4NC77sH3fwqr4gn974pfmXwJZT1-4ACBxKlsO-d6nZTvODNhsSJGaYzudJX5hRCyLNLdU8IEDzRoAFXUULHBDJH_A2qfuw1EngXIdJoNc_A17HLxSJVnjN1WhrtaFQAZlhXV4wQOPNr3TPeS_S_BEJj7ebOTRmpa0gs',
        category: 'Clothing',
        inStock: true,
        rating: 4.4
      },
      {
        id: 8,
        name: 'Comfortable Sweater',
        description: 'Cozy sweater for relaxed days. Soft knit fabric that keeps you warm while looking effortlessly stylish.',
        price: 79.99,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLNsIuPcZ165Nm9HdgyFfayULSS0gHg4-MYOcv83cf7apaf8R7l-ue69sxzmEDLqOY_4d8JMwb8tlR1dRaa-Jw5cV3NV2I4DVm0UbdjYEN27UPF-o8QAQNfmMK3fowJM0T2XPZrOuxhearvDi_FQOLO_5mFhUm7Zly0QP7tehsPJbiD4CLgab6949iezqXDy_Mx-3YC20o8HGN3-jSNMl_zXoWx1gX3kBQxNFMKF_s5xwGQi27QFtlppNjnbr8r83A_31n_UACOPo',
        category: 'Clothing',
        inStock: true,
        rating: 4.1
      }
    ];
  }
}
