import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ProductService } from '../../core/services/product.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';

import { WishlistButtonComponent } from '../../shared/components/wishlist-button/wishlist-button.component';

interface CategoryCard {
  id: string;
  name: string;
  imageUrl: string;
  route: string;
  queryParams?: any;
}

interface PromotionalBanner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  route: string;
  queryParams?: any;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    WishlistButtonComponent
  ],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit, OnDestroy {
  trendingProducts: Product[] = [];
  loading = true;
  email = '';
  
  private subscriptions: Subscription[] = [];

  readonly featuredCategories: CategoryCard[] = [
    {
      id: 'new-arrivals',
      name: 'New Arrivals',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2-ak4FwlAgdNAGASnFIm38_RKuSc_-OrLJ9mUOnN13pNXzFtpgUVXIPOSLNCkJam6wdT_IpZDthibV2aJ8umYOcDVmdQ-TYyryKbrw1AiJ-BWddfvkZ8LbEyVerApNdLPcIm1BY2H054Fp5BSATcrHpPiW4kGZc-5TcGaEIPxYmQ0M45pKXiR_xmGGO1VD8-Rp4i5k3XHeFqkShzVW6ZaF2erOv6n7v3QywoC6n224kiZP8545J-oC-wpLa7q-HmpYP9pflDE--o',
      route: '/products',
      queryParams: { category: 'new-arrivals' }
    },
    {
      id: 'clothing',
      name: 'Clothing',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxz4fKbDftQ2PNlFp9c5vXTfN8ErbH70zN2rFURUiGFWr3HQ2jb0nEW7ebvleGYy8GIVVnpIwWFE9jqMyDk5fOio4TiJUWiAocsBm3FSF0zhvO5oidUYGUlEqGCKRUAZ9gi-cPMwFq6spc566yhFp1E0B137JGpLDXXQoWHj4FI1CwtjBXJxFAHDFHV2GfBzII0rDt0lQR7FUrY6PUnkKWjtcvFcHEOz13ovpJjTqRqMEuFCNL6MbcqnUuD2i5D0HUfb7JuMZ9_yI',
      route: '/products',
      queryParams: { category: 'clothing' }
    },
    {
      id: 'shoes',
      name: 'Shoes',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNI2rO6D-BE0xiMpTGdtRPwgVRkkPzbcZBajV4GQFzXki4LI5mc369M2UwP4Hlq3RpO6Uuvx4xoh5__56u0jFM4Ge0BC44Ks6N6Mr1ZutGPHEdtvCy6GoHcYXvhpQT0ngcoOP0C92aVHu-VxotmuIcQZ_To_FOqqId0Hyj8hzVM46AoIzqAJ8wCviAOp0NqU-VSG8zQlioyq7FhBJJAuG_spj5SwE-JSHYfp6fTIOIUqBWuYMh6q7xe9wgsE8xpuoiNt9DGIO3_Cw',
      route: '/products',
      queryParams: { category: 'shoes' }
    },
    {
      id: 'accessories',
      name: 'Accessories',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUJlr3vQQOh1g-Fp4pAOxjyXcdqzZSMiiEYeoG5Kt0LgeIsmNSt1Ci7ggjTRDKRtGAc9nATy9QVE08-D-W-T6bioDap3WO9QJOLzS022S2iwn8Td13jJj6X3XA5MHlEdFcSAPpzgccHcFWF3ZQDyR0udeyEVZBTrhVOzPiBqvIaiHRxTPQN1_Ya0hDwK5K6WBwgwlV6xCc1M9IjwyB4x06J_TNmybdshUL-gjU404IlzoLAcxdX1BzVLx39GTv0iZK_Pi-PzI7Zy0',
      route: '/products',
      queryParams: { category: 'accessories' }
    }
  ];

  readonly promotionalBanners: PromotionalBanner[] = [
    {
      id: 'sale',
      title: 'Sale',
      description: 'Up to 50% off on selected items',
      buttonText: 'Shop Now',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjZlQAcjgOxhjER4lKpa0JJT766z6eLqvw6nTOYRBv0FEje0sdJXpbS1ShLrE_WMXzJU4NWC01tZ3NzaizlouEuPU34Hq3ZZCgj7MpScJIHvH3AHEta5OvnCMCoTCcx6p8HzJZZmGxK4hLajWN210Qp640EHbroKbhEwWvo9hspFrXdSe4pWWNj_4AePSlPU1hVyNqXcqq3Kxtr_5JMLYnjwG71hS7N1T_9RvtGLBDqPtu9pU4Tu8BZKYRSzYmfOfDg6Y-zMz9nCA',
      route: '/products',
      queryParams: { sale: 'true' }
    },
    {
      id: 'new-collection',
      title: 'New Collection',
      description: 'Explore the latest trends',
      buttonText: 'Discover',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCk1FID1GCMDFlftFPLBBulyK2nC7Pzyiajkf15iomVt3VVaZGiYaXa97mdH5AEuzC0zlwZJgqgndHXiVoxzhGOhrK0V3Veq9CBaFnZ-PFPwjBB2agSzHtLrd6by-BodnHtxH04s8IRgPyl5t2FyLJGZbaOLqr9ZZIiJJYzPid9M0WVOK7k9ElJrqLBExK4a6L6YesKs7jWwMtwBU_rNZx9tlJEuOHBj-uLDOpUnJ5UYBsbULtWVzNwG2h_WONha54pWIl1oHzpslk',
      route: '/products',
      queryParams: { category: 'new-arrivals' }
    }
  ];

  constructor(
    private productService: ProductService,
    private wishlistService: WishlistService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadTrendingProducts();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadTrendingProducts(): void {
    this.loading = true;
    
    const productsSub = this.productService.getProducts().subscribe({
      next: (products) => {
        // Get first 4 products as trending
        this.trendingProducts = products.slice(0, 4);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading trending products:', error);
        this.loading = false;
      }
    });

    this.subscriptions.push(productsSub);
  }

  onShopNow(): void {
    // Navigate to products page
  }

  onViewCollections(): void {
    // Navigate to products page with featured category
  }

  onAddToWishlist(product: Product): void {
    const success = this.wishlistService.addToWishlist(product);
    if (success) {
      console.log('Product added to wishlist');
    } else {
      console.log('Product already in wishlist');
    }
  }

  onAddToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }

  onSubscribeNewsletter(): void {
    if (this.email && this.isValidEmail(this.email)) {
      // TODO: Implement newsletter subscription
      console.log('Subscribing email:', this.email);
      this.email = '';
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  trackByCategoryId(index: number, category: CategoryCard): string {
    return category.id;
  }

  trackByBannerId(index: number, banner: PromotionalBanner): string {
    return banner.id;
  }

  // New Methods for Enhanced Homepage
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getCategoryDescription(categoryName: string): string {
    const descriptions: { [key: string]: string } = {
      'New Arrivals': 'Latest trends and styles',
      'Clothing': 'Fashion essentials for every occasion',
      'Shoes': 'Step out in style and comfort',
      'Accessories': 'Perfect finishing touches'
    };
    return descriptions[categoryName] || 'Discover amazing products';
  }

  isNewProduct(product: Product): boolean {
    // Mock logic to determine if product is new (could be based on creation date)
    return product.id % 3 === 0; // Every 3rd product is "new" for demo
  }

  getDiscountPercentage(product: Product): number {
    if (!product.originalPrice || product.originalPrice <= product.price) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }

  onQuickAddToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
    // Could show a toast notification here
    console.log(`${product.name} added to cart`);
  }
} 