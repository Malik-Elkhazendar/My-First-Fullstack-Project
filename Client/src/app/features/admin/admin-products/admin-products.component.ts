import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

// Core imports using barrel exports
import { AdminService, AdminProduct, AdminNavItem } from '../../../core';

// Shared imports using barrel exports
import { 
  TableColumn, 
  TableAction, 
  PaginationConfig,
  ConfirmationDialogComponent,
  ConfirmationDialogData
} from '../../../shared';

// Constants
import { APP_CONSTANTS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../../shared/constants/app.constants';

/**
 * Admin products management component
 * 
 * Provides comprehensive product management functionality for administrators
 * including viewing, searching, filtering, adding, editing, and deleting products.
 * Uses the reusable DataTableComponent for consistent UI and functionality.
 * 
 * @example
 * ```html
 * <app-admin-products></app-admin-products>
 * ```
 * 
 * @since 1.0.0
 * @author Fashion Forward Team
 */
@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.scss']
})
export class AdminProductsComponent implements OnInit, OnDestroy {
  /** Destruction subject for cleanup */
  private readonly destroy$ = new Subject<void>();
  
  /** All products data */
  products: AdminProduct[] = [];
  
  /** Filtered products for display */
  filteredProducts: AdminProduct[] = [];
  
  /** Search term for product filtering */
  searchTerm = '';
  
  /** Selected category filter */
  selectedCategory = '';
  
  /** Selected status filter */
  selectedStatus = '';
  
  /** Available product categories */
  categories: string[] = [];
  
  /** Navigation items for admin sidebar */
  navigationItems: AdminNavItem[] = [];
  
  /** Loading state */
  loading = false;

  /** Table column configuration */
  tableColumns: TableColumn<AdminProduct>[] = [
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      cellTemplate: 'nameCell'
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      type: 'currency',
      align: 'right'
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      align: 'center',
      cellTemplate: 'stockCell'
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      align: 'center',
      cellTemplate: 'statusCell'
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      type: 'date'
    }
  ];

  /** Table actions configuration */
  tableActions: TableAction<AdminProduct>[] = [
    {
      id: 'edit',
      label: 'Edit Product',
      icon: 'edit',
      color: 'primary',
      tooltip: 'Edit product details'
    },
    {
      id: 'toggle-status',
      label: 'Toggle Status',
      icon: 'power_settings_new',
      color: 'accent',
      tooltip: 'Activate/Deactivate product'
    },
    {
      id: 'delete',
      label: 'Delete Product',
      icon: 'delete',
      color: 'warn',
      tooltip: 'Delete product permanently',
      visible: (product) => !product.isActive
    }
  ];

  /** Pagination configuration */
  paginationConfig: PaginationConfig = {
    pageIndex: 0,
    pageSize: APP_CONSTANTS.UI_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
    totalItems: 0,
    pageSizeOptions: [...APP_CONSTANTS.UI_CONFIG.PAGINATION.PAGE_SIZE_OPTIONS],
    showFirstLastButtons: true
  };
  
  /**
   * Initialize the admin products component
   * 
   * @param adminService - Service for admin operations
   * @param dialog - Material dialog service for confirmations
   */
  constructor(
    private readonly adminService: AdminService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    // Set navigation items
    this.navigationItems = this.adminService.getNavigationItems().map(item => ({
      ...item,
      active: item.id === 'products'
    }));

    // Load products
    this.adminService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        this.products = products;
        this.filteredProducts = products;
        this.extractCategories();
      });

    // Subscribe to loading state
    this.adminService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });
  }

  private extractCategories(): void {
    const categorySet = new Set(this.products.map(p => p.category));
    this.categories = Array.from(categorySet).sort();
  }

  /**
   * Handle page change events from data table
   * 
   * @param event - Page change event
   */
  onPageChange(event: PageEvent): void {
    this.paginationConfig.pageIndex = event.pageIndex;
    this.paginationConfig.pageSize = event.pageSize;
    this.loadProducts();
  }

  /**
   * Enhanced search with debouncing
   */
  onSearch(): void {
    // Reset to first page when searching
    this.paginationConfig.pageIndex = 0;
    this.applyFilters();
  }

  /**
   * Load products with pagination and filtering
   */
  private loadProducts(): void {
    this.loading = true;
    
    // Simulate API call with pagination
    setTimeout(() => {
      const filteredProducts = this.applyProductFilters();
      
      // Apply pagination
      const startIndex = this.paginationConfig.pageIndex * this.paginationConfig.pageSize;
      const endIndex = startIndex + this.paginationConfig.pageSize;
      
      this.filteredProducts = filteredProducts.slice(startIndex, endIndex);
      this.paginationConfig.totalItems = filteredProducts.length;
      
      this.loading = false;
    }, 500);
  }

  /**
   * Apply filters to products
   */
  private applyProductFilters(): AdminProduct[] {
    return this.products.filter(product => {
      const matchesSearch = !this.searchTerm || 
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || 
        product.category === this.selectedCategory;
      
      const matchesStatus = !this.selectedStatus || 
        (this.selectedStatus === 'active' && product.isActive) ||
        (this.selectedStatus === 'inactive' && !product.isActive);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  onCategoryChange(category?: string): void {
    if (category !== undefined) {
      this.selectedCategory = category;
    }
    this.applyFilters();
  }

  filterByStatus(isActive: boolean): void {
    this.filteredProducts = this.products.filter(product => product.isActive === isActive);
  }

  private applyFilters(): void {
    this.filteredProducts = this.products.filter(product => {
      const matchesSearch = !this.searchTerm || 
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || 
        product.category === this.selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }

  /**
   * Handle table action clicks
   * 
   * @param event - Action click event with action and row data
   */
  onTableAction(event: { action: TableAction<AdminProduct>; row: AdminProduct; event: Event }): void {
    const { action, row } = event;
    
    switch (action.id) {
      case 'edit':
        this.editProduct(row);
        break;
      case 'toggle-status':
        this.toggleProductStatus(row);
        break;
      case 'delete':
        this.deleteProduct(row);
        break;
      default:
        console.warn('Unknown action:', action.id);
    }
  }

  /**
   * Add new product
   * 
   * Opens the product creation dialog/form
   */
  onAddProduct(): void {
    // TODO: Implement add product functionality
    console.log('Add product clicked');
  }

  /**
   * Edit product - public method for template
   * 
   * @param product - Product to edit
   */
  onEditProduct(product: AdminProduct): void {
    this.editProduct(product);
  }

  /**
   * Toggle product status - public method for template
   * 
   * @param product - Product to toggle
   */
  onToggleStatus(product: AdminProduct): void {
    this.toggleProductStatus(product);
  }

  /**
   * Edit existing product
   * 
   * @param product - Product to edit
   */
  private editProduct(product: AdminProduct): void {
    // TODO: Implement edit product functionality
    console.log('Edit product:', product);
  }

  /**
   * Delete product with confirmation
   * 
   * @param product - Product to delete
   */
  private deleteProduct(product: AdminProduct): void {
    const dialogData: ConfirmationDialogData = {
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"?`,
      details: 'This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      icon: 'delete'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.performDelete(product);
      }
    });
  }

  /**
   * Perform the actual product deletion
   * 
   * @param product - Product to delete
   */
  private performDelete(product: AdminProduct): void {
    // TODO: Implement actual deletion with API call
    console.log('Deleting product:', product);
    
    // Remove from local array for demo
    const index = this.products.findIndex(p => p.id === product.id);
    if (index > -1) {
      this.products.splice(index, 1);
      this.applyFilters();
      
      // Show success message (would use notification service in real app)
      console.log(SUCCESS_MESSAGES.PROFILE.UPDATED); // Replace with proper success message
    }
  }

  /**
   * Toggle product active status
   * 
   * @param product - Product to toggle
   */
  private toggleProductStatus(product: AdminProduct): void {
    const action = product.isActive ? 'deactivate' : 'activate';
    const dialogData: ConfirmationDialogData = {
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Product`,
      message: `Are you sure you want to ${action} "${product.name}"?`,
      type: 'warning',
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.performStatusToggle(product);
      }
    });
  }

  /**
   * Perform the actual status toggle
   * 
   * @param product - Product to toggle
   */
  private performStatusToggle(product: AdminProduct): void {
    // TODO: Implement actual status toggle with API call
    product.isActive = !product.isActive;
    console.log(`Product ${product.name} ${product.isActive ? 'activated' : 'deactivated'}`);
  }

  formatPrice(price: number): string {
    return this.adminService.formatCurrency(price);
  }

  getStockStatus(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
  }

  getStockStatusClass(stock: number): string {
    if (stock === 0) return 'text-red-600';
    if (stock < 10) return 'text-yellow-600';
    return 'text-green-600';
  }

  trackByProductId(index: number, product: AdminProduct): number {
    return product.id;
  }

  trackByNavId(index: number, item: AdminNavItem): string {
    return item.id;
  }

  // Get SVG icon path for navigation items
  getIconSvg(iconName: string): string {
    const icons: { [key: string]: string } = {
      'House': 'M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z',
      'Package': 'M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z',
      'Receipt': 'M72,104a8,8,0,0,1,8-8h96a8,8,0,0,1,0,16H80A8,8,0,0,1,72,104Zm8,40h96a8,8,0,0,0,0-16H80a8,8,0,0,0,0,16ZM232,56V208a8,8,0,0,1-11.58,7.15L192,200.94l-28.42,14.21a8,8,0,0,1-7.16,0L128,200.94,99.58,215.15a8,8,0,0,1-7.16,0L64,200.94,35.58,215.15A8,8,0,0,1,24,208V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Zm-16,0H40V195.06l20.42-10.22a8,8,0,0,1,7.16,0L96,199.06l28.42-14.22a8,8,0,0,1,7.16,0L160,199.06l28.42-14.22a8,8,0,0,1,7.16,0L216,195.06Z',
      'Users': 'M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z',
      'Gear': 'M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25a8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z'
    };
    return icons[iconName] || '';
  }
} 