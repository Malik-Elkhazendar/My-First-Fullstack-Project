import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private productsSubject = new BehaviorSubject<Product[]>([]);

  // Mock data for development (remove when backend is ready)
  private mockProducts: Product[] = [];

  constructor(private http: HttpClient) {
    this.initializeMockData();
  }

  // Public observables
  get loading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  get products$(): Observable<Product[]> {
    return this.productsSubject.asObservable();
  }

  // CRUD Operations
  getProducts(): Observable<Product[]> {
    this.setLoading(true);

    // For now, return mock data. Replace with HTTP call when backend is ready
    return of(this.mockProducts).pipe(
      tap((products) => {
        this.productsSubject.next(products);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );

    // Future HTTP implementation:
    /*
    return this.http.get<Product[]>(this.apiUrl).pipe(
      tap((products) => {
        this.productsSubject.next(products);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );
    */
  }

  getProductById(id: number): Observable<Product> {
    this.setLoading(true);

    // Mock implementation
    const product = this.mockProducts.find(p => p.id === id);
    if (product) {
      this.setLoading(false);
      return of(product);
    }

    this.setLoading(false);
    return throwError(() => new Error('Product not found'));

    // Future HTTP implementation:
    /*
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
    */
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    this.setLoading(true);

    const filteredProducts = this.mockProducts.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );

    this.setLoading(false);
    return of(filteredProducts);

    // Future HTTP implementation:
    /*
    return this.http.get<Product[]>(`${this.apiUrl}/category/${category}`).pipe(
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
    */
  }

  searchProducts(query: string): Observable<Product[]> {
    this.setLoading(true);

    const searchResults = this.mockProducts.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase())
    );

    this.setLoading(false);
    return of(searchResults);

    // Future HTTP implementation:
    /*
    return this.http.get<Product[]>(`${this.apiUrl}/search?q=${query}`).pipe(
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
    */
  }

  // Utility methods
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  isInStock(product: Product): boolean {
    return product.inStock;
  }

  getStockStatus(product: Product): string {
    return product.inStock ? 'In Stock' : 'Out of Stock';
  }

  // Private helper methods
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}`;
    }

    console.error('ProductService Error:', error);
    return throwError(() => new Error(errorMessage));
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
