import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  loading = true;
  loadingRelated = false;
  error: string | null = null;
  quantity = 1;
  selectedQuantity = 1;
  isAddingToCart = false;
  activeTab = 'description';
  
  mockReviews = [
    {
      author: 'John D.',
      rating: 5,
      date: '2 weeks ago',
      comment: 'Excellent product! Great quality and fast shipping. Highly recommended!'
    },
    {
      author: 'Sarah M.',
      rating: 4,
      date: '1 month ago',
      comment: 'Very satisfied with this purchase. Good value for money and works as expected.'
    },
    {
      author: 'Mike R.',
      rating: 5,
      date: '6 weeks ago',
      comment: 'Outstanding quality and design. Exceeded my expectations in every way!'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private snackBar: MatSnackBar,
    private productService: ProductService,
    private authService: AuthService,
    private cartService: CartService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  // Data Loading
  private loadProduct(id: number): void {
    this.loading = true;
    this.error = null;

    // Simulate API call
    setTimeout(() => {
      this.productService.getProductById(id).subscribe({
        next: (product: Product) => {
          this.product = product;
          this.loadRelatedProducts();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading product:', error);
          this.error = 'Product not found';
          this.loading = false;
        }
      });
    }, 800);
  }

  private loadRelatedProducts(): void {
    if (!this.product) return;
    
    this.loadingRelated = true;
    
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.relatedProducts = products
          .filter(p => p.id !== this.product!.id && p.category === this.product!.category)
          .slice(0, 4);
        this.loadingRelated = false;
      },
      error: (error: any) => {
        console.error('Error loading related products:', error);
        this.relatedProducts = [];
        this.loadingRelated = false;
      }
    });
  }

  // Navigation
  goBack(): void {
    this.location.back();
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  // Quantity Management
  incrementQuantity(): void {
    if (this.quantity < 10) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  // Product Actions
  addToCart(): void {
    if (!this.product || !this.product.inStock) return;
    
    this.isAddingToCart = true;
    
    // Simulate API call delay
    setTimeout(() => {
      this.cartService.addToCart(this.product!, this.selectedQuantity);
      this.isAddingToCart = false;
      
      const quantityText = this.selectedQuantity === 1 ? '' : ` (${this.selectedQuantity})`;
      this.snackBar.open(
        `${this.product!.name}${quantityText} added to cart!`, 
        'View Cart', 
        {
          duration: 3000,
          panelClass: ['success-snackbar']
        }
      ).onAction().subscribe(() => {
        this.router.navigate(['/cart']);
      });
    }, 800);
  }

  buyNow(): void {
    if (!this.product || !this.isInStock(this.product)) return;
    
    // Buy now logic here - redirect to checkout
    this.snackBar.open(
      'Redirecting to checkout...', 
      'Close', 
      {
        duration: 2000,
        panelClass: ['info-snackbar']
      }
    );
  }

  addToWishlist(): void {
    if (!this.product) return;
    
    const wasAdded = this.wishlistService.toggleWishlist(this.product);
    
    if (wasAdded) {
      this.snackBar.open(
        `${this.product.name} added to wishlist!`, 
        'View Wishlist', 
        {
          duration: 3000,
          panelClass: ['success-snackbar']
        }
      ).onAction().subscribe(() => {
        this.router.navigate(['/wishlist']);
      });
    } else {
      this.snackBar.open(
        `${this.product.name} removed from wishlist!`, 
        'Close', 
        {
          duration: 2000,
          panelClass: ['info-snackbar']
        }
      );
    }
  }

  // Utility Methods
  getImageUrl(imageUrl: string): string {
    if (!imageUrl || imageUrl.trim() === '') {
      return 'assets/images/placeholder-product.jpg';
    }
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    return `assets/images/${imageUrl}`;
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/images/placeholder-product.jpg';
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  isInStock(product: Product): boolean {
    return product.inStock;
  }

  isInWishlist(): boolean {
    return this.product ? this.wishlistService.isInWishlist(this.product.id) : false;
  }

  getStockStatus(product: Product): string {
    return product.inStock ? 'In Stock' : 'Out of Stock';
  }

  getStockIcon(product: Product): string {
    return product.inStock ? 'check_circle' : 'cancel';
  }

  // Rating Methods
  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getEmptyStarArray(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }

  // Discount Methods
  hasDiscount(product: Product): boolean {
    return !!(product.originalPrice && product.originalPrice > product.price);
  }

  getDiscountPercentage(product: Product): number {
    if (!this.hasDiscount(product)) return 0;
    return Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100);
  }

  getSavingsAmount(product: Product): number {
    if (!this.hasDiscount(product)) return 0;
    return product.originalPrice! - product.price;
  }

  // Tab and Review Methods
  getReviewCount(): number {
    // Simulate review count based on rating
    return Math.floor((this.product?.rating || 4) * 25);
  }

  getRatingPercentage(rating: number): number {
    if (!this.product) return 0;
    const total = this.getReviewCount();
    // Simulate distribution based on product rating
    const distribution = {
      5: this.product.rating >= 4.5 ? 60 : this.product.rating >= 4 ? 40 : 20,
      4: this.product.rating >= 4 ? 25 : 30,
      3: this.product.rating >= 3 ? 10 : 25,
      2: this.product.rating >= 2 ? 3 : 15,
      1: this.product.rating >= 2 ? 2 : 10
    };
    return distribution[rating as keyof typeof distribution] || 0;
  }

  getRatingCount(rating: number): number {
    const total = this.getReviewCount();
    const percentage = this.getRatingPercentage(rating);
    return Math.floor((percentage / 100) * total);
  }

  // Related Products Methods
  addRelatedToCart(product: Product): void {
    if (!product.inStock) return;
    
    this.cartService.addToCart(product, 1);
    this.snackBar.open(
      `${product.name} added to cart!`, 
      'View Cart', 
      {
        duration: 3000,
        panelClass: ['success-snackbar']
      }
    ).onAction().subscribe(() => {
      this.router.navigate(['/cart']);
    });
  }

  addRelatedToWishlist(product: Product): void {
    const wasAdded = this.wishlistService.toggleWishlist(product);
    
    if (wasAdded) {
      this.snackBar.open(
        `${product.name} added to wishlist!`, 
        'View Wishlist', 
        {
          duration: 3000,
          panelClass: ['success-snackbar']
        }
      ).onAction().subscribe(() => {
        this.router.navigate(['/wishlist']);
      });
    } else {
      this.snackBar.open(
        `${product.name} removed from wishlist!`, 
        'Close', 
        {
          duration: 2000,
          panelClass: ['info-snackbar']
        }
      );
    }
  }
}
