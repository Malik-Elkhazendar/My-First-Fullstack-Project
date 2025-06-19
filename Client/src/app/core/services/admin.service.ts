import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { DashboardStats, RecentOrder, OrderStatus, AdminNavItem } from '../models/admin.model';
import { Product } from '../models/product.model';
import { User, UserRole } from '../models/user.model';

export interface AdminUser extends Omit<User, 'id'> {
  id: number; // Make id required for admin users
  registrationDate: string;
  lastLogin: string;
  orderCount: number;
  totalSpent: number;
  isActive: boolean;
}

export interface AdminProduct extends Product {
  stock: number;
  isActive: boolean;
  reviewCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private dashboardStatsSubject = new BehaviorSubject<DashboardStats | null>(null);
  private recentOrdersSubject = new BehaviorSubject<RecentOrder[]>([]);
  private productsSubject = new BehaviorSubject<AdminProduct[]>([]);
  private usersSubject = new BehaviorSubject<AdminUser[]>([]);

  // Public observables
  get loading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  get dashboardStats$(): Observable<DashboardStats | null> {
    return this.dashboardStatsSubject.asObservable();
  }

  get recentOrders$(): Observable<RecentOrder[]> {
    return this.recentOrdersSubject.asObservable();
  }

  get products$(): Observable<AdminProduct[]> {
    return this.productsSubject.asObservable();
  }

  get users$(): Observable<AdminUser[]> {
    return this.usersSubject.asObservable();
  }

  constructor() {}

  // Navigation items for admin sidebar
  getNavigationItems(): AdminNavItem[] {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'House',
        route: '/admin',
        active: true
      },
      {
        id: 'products',
        label: 'Products',
        icon: 'Package',
        route: '/admin/products'
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: 'Receipt',
        route: '/admin/orders'
      },
      {
        id: 'users',
        label: 'Users',
        icon: 'Users',
        route: '/admin/users'
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'Gear',
        route: '/admin/settings'
      }
    ];
  }

  // Get dashboard statistics
  getDashboardStats(): Observable<DashboardStats> {
    this.setLoading(true);

    // Mock data - replace with actual API call in production
    const mockStats: DashboardStats = {
      totalProducts: 120,
      totalOrders: 350,
      totalUsers: 200,
      totalRevenue: 25000
    };

    return of(mockStats).pipe(
      delay(800), // Simulate API delay
      tap(stats => {
        this.dashboardStatsSubject.next(stats);
        this.setLoading(false);
      })
    );
  }

  // Get recent orders
  getRecentOrders(): Observable<RecentOrder[]> {
    this.setLoading(true);

    // Mock data - replace with actual API call in production
    const mockOrders: RecentOrder[] = [
      {
        id: '#1001',
        customer: 'Sophia Clark',
        date: '2024-07-26',
        status: OrderStatus.Shipped,
        total: 50.00,
        itemCount: 2
      },
      {
        id: '#1002',
        customer: 'Liam Carter',
        date: '2024-07-25',
        status: OrderStatus.Processing,
        total: 75.00,
        itemCount: 1
      },
      {
        id: '#1003',
        customer: 'Olivia Bennett',
        date: '2024-07-24',
        status: OrderStatus.Delivered,
        total: 120.00,
        itemCount: 3
      },
      {
        id: '#1004',
        customer: 'Noah Foster',
        date: '2024-07-23',
        status: OrderStatus.Shipped,
        total: 90.00,
        itemCount: 2
      },
      {
        id: '#1005',
        customer: 'Ava Harper',
        date: '2024-07-22',
        status: OrderStatus.Delivered,
        total: 60.00,
        itemCount: 1
      }
    ];

    return of(mockOrders).pipe(
      delay(600), // Simulate API delay
      tap(orders => {
        this.recentOrdersSubject.next(orders);
        this.setLoading(false);
      })
    );
  }

  // Get products
  getProducts(): Observable<AdminProduct[]> {
    this.setLoading(true);

    const mockProducts: AdminProduct[] = [
      {
        id: 1,
        name: 'Classic White Shirt',
        description: 'Premium cotton white shirt perfect for any occasion',
        price: 79.99,
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
        category: 'Shirts',
        inStock: true,
        rating: 4.5,
        stock: 25,
        isActive: true,
        reviewCount: 128
      },
      {
        id: 2,
        name: 'Denim Jacket',
        description: 'Vintage-style denim jacket with modern fit',
        price: 129.99,
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        category: 'Jackets',
        inStock: true,
        rating: 4.7,
        stock: 15,
        isActive: true,
        reviewCount: 89
      },
      {
        id: 3,
        name: 'Summer Dress',
        description: 'Light and airy summer dress in floral print',
        price: 89.99,
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
        category: 'Dresses',
        inStock: false,
        rating: 4.3,
        stock: 0,
        isActive: false,
        reviewCount: 67
      },
      {
        id: 4,
        name: 'Leather Boots',
        description: 'Handcrafted leather boots for all seasons',
        price: 199.99,
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
        category: 'Shoes',
        inStock: true,
        rating: 4.8,
        stock: 8,
        isActive: true,
        reviewCount: 156
      },
      {
        id: 5,
        name: 'Wool Sweater',
        description: 'Cozy wool sweater for cold weather',
        price: 119.99,
        imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400',
        category: 'Sweaters',
        inStock: true,
        rating: 4.6,
        stock: 32,
        isActive: true,
        reviewCount: 94
      }
    ];

    return of(mockProducts).pipe(
      delay(500),
      tap(products => {
        this.productsSubject.next(products);
        this.setLoading(false);
      })
    );
  }

  // Get users
  getUsers(): Observable<AdminUser[]> {
    this.setLoading(true);

    const mockUsers: AdminUser[] = [
      {
        id: 1,
        firstName: 'Emma',
        lastName: 'Bennett',
        email: 'emma.bennett@email.com',
        role: UserRole.Customer,
        registrationDate: '2023-01-15T00:00:00Z',
        lastLogin: '2024-05-20T00:00:00Z',
        orderCount: 12,
        totalSpent: 550,
        isActive: true
      },
      {
        id: 2,
        firstName: 'Owen',
        lastName: 'Carter',
        email: 'owen.carter@email.com',
        role: UserRole.Customer,
        registrationDate: '2022-11-22T00:00:00Z',
        lastLogin: '2024-05-18T00:00:00Z',
        orderCount: 8,
        totalSpent: 320,
        isActive: true
      },
      {
        id: 3,
        firstName: 'Chloe',
        lastName: 'Foster',
        email: 'chloe.foster@email.com',
        role: UserRole.Customer,
        registrationDate: '2023-03-05T00:00:00Z',
        lastLogin: '2024-05-15T00:00:00Z',
        orderCount: 15,
        totalSpent: 780,
        isActive: true
      },
      {
        id: 4,
        firstName: 'Lucas',
        lastName: 'Hayes',
        email: 'lucas.hayes@email.com',
        role: UserRole.Customer,
        registrationDate: '2023-05-10T00:00:00Z',
        lastLogin: '2024-05-12T00:00:00Z',
        orderCount: 5,
        totalSpent: 180,
        isActive: false
      },
      {
        id: 5,
        firstName: 'Lily',
        lastName: 'Morgan',
        email: 'lily.morgan@email.com',
        role: UserRole.Customer,
        registrationDate: '2022-09-01T00:00:00Z',
        lastLogin: '2024-05-10T00:00:00Z',
        orderCount: 20,
        totalSpent: 1200,
        isActive: true
      },
      {
        id: 6,
        firstName: 'Caleb',
        lastName: 'Reed',
        email: 'caleb.reed@email.com',
        role: UserRole.Customer,
        registrationDate: '2023-07-18T00:00:00Z',
        lastLogin: '2024-05-08T00:00:00Z',
        orderCount: 3,
        totalSpent: 90,
        isActive: false
      },
      {
        id: 7,
        firstName: 'Grace',
        lastName: 'Scott',
        email: 'grace.scott@email.com',
        role: UserRole.Customer,
        registrationDate: '2023-02-28T00:00:00Z',
        lastLogin: '2024-05-05T00:00:00Z',
        orderCount: 10,
        totalSpent: 450,
        isActive: true
      },
      {
        id: 8,
        firstName: 'Henry',
        lastName: 'Turner',
        email: 'henry.turner@email.com',
        role: UserRole.Customer,
        registrationDate: '2022-12-10T00:00:00Z',
        lastLogin: '2024-05-02T00:00:00Z',
        orderCount: 7,
        totalSpent: 250,
        isActive: true
      },
      {
        id: 9,
        firstName: 'Ella',
        lastName: 'Wright',
        email: 'ella.wright@email.com',
        role: UserRole.Customer,
        registrationDate: '2023-04-20T00:00:00Z',
        lastLogin: '2024-04-28T00:00:00Z',
        orderCount: 18,
        totalSpent: 950,
        isActive: true
      },
      {
        id: 10,
        firstName: 'Daniel',
        lastName: 'Young',
        email: 'daniel.young@email.com',
        role: UserRole.Customer,
        registrationDate: '2023-06-05T00:00:00Z',
        lastLogin: '2024-04-25T00:00:00Z',
        orderCount: 2,
        totalSpent: 50,
        isActive: false
      }
    ];

    return of(mockUsers).pipe(
      delay(500),
      tap(users => {
        this.usersSubject.next(users);
        this.setLoading(false);
      })
    );
  }

  // Get navigation items as observable
  getNavItems(): Observable<AdminNavItem[]> {
    const navItems = this.getNavigationItems();
    return of(navItems);
  }

  // Get status display properties
  getStatusDisplayProperties(status: OrderStatus): { class: string; label: string } {
    switch (status) {
      case OrderStatus.Pending:
        return { class: 'bg-yellow-100 text-yellow-800', label: 'Pending' };
      case OrderStatus.Processing:
        return { class: 'bg-blue-100 text-blue-800', label: 'Processing' };
      case OrderStatus.Shipped:
        return { class: 'bg-indigo-100 text-indigo-800', label: 'Shipped' };
      case OrderStatus.Delivered:
        return { class: 'bg-green-100 text-green-800', label: 'Delivered' };
      case OrderStatus.Cancelled:
        return { class: 'bg-red-100 text-red-800', label: 'Cancelled' };
      default:
        return { class: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    }
  }

  // Get status display text
  getStatusDisplayText(status: OrderStatus): string {
    const statusMap = {
      [OrderStatus.Pending]: 'Pending',
      [OrderStatus.Processing]: 'Processing',
      [OrderStatus.Shipped]: 'Shipped',
      [OrderStatus.Delivered]: 'Delivered',
      [OrderStatus.Cancelled]: 'Cancelled'
    };
    return statusMap[status] || 'Unknown';
  }

  // Get status icon
  getStatusIcon(status: OrderStatus): string {
    const iconMap = {
      [OrderStatus.Pending]: 'schedule',
      [OrderStatus.Processing]: 'autorenew',
      [OrderStatus.Shipped]: 'local_shipping',
      [OrderStatus.Delivered]: 'check_circle',
      [OrderStatus.Cancelled]: 'cancel'
    };
    return iconMap[status] || 'help';
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-CA'); // This gives YYYY-MM-DD format
  }

  // Private helper methods
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
} 