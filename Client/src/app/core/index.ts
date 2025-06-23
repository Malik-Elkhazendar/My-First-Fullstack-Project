// Core Module Barrel Exports
// This file provides a single entry point for all core module exports

// Models - Export specific items to avoid conflicts
export type { User, AuthResponse, LoginRequest, RegisterRequest } from './models/user.model';
export { UserRole } from './models/user.model';
export type { 
  Product, 
  ProductColor, 
  ProductVariant, 
  ProductReview, 
  ProductDimensions,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
  ProductSearchParams,
  ProductResponse
} from './models/product.model';
export { 
  ProductCategory, 
  ProductStatus, 
  ProductSize,
  isProduct,
  isValidCategory
} from './models/product.model';
export type { Order } from './models/order.model';
export type { Address } from './models/address.model';
export type { AdminNavItem } from './models/admin.model';
export { OrderStatus } from './models/admin.model';
export type { Wishlist, WishlistItem } from './models/wishlist.model';

// Services - Export specific items to avoid conflicts
export type { AppError } from './services/error-handling.service';
export type { AdminProduct, AdminUser } from './services/admin.service';
export { AuthService } from './services/auth.service';
export { ProductService } from './services/product.service';
export { CartService } from './services/cart.service';
export { OrderService } from './services/order.service';
export { WishlistService } from './services/wishlist.service';
export { AddressService } from './services/address.service';
export { AdminService } from './services/admin.service';
export { ErrorHandlingService } from './services/error-handling.service';
export { FormValidationService } from './services/form-validation.service';
export { LoadingService } from './services/loading.service';
export { ImageService } from './services/image.service';
export { ConfigService } from './services/config.service';

// Guards
export * from './guards/auth.guard';

// Interceptors
export * from './interceptors/auth.interceptor';

// Core Module
export * from './core.module'; 