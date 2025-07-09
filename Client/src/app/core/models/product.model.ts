export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  rating: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: string;
  size: ProductSize;
  color: ProductColor;
  price: number;
  inStock: boolean;
}

export interface ProductReview {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: ProductCategory;
  inStock: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  imageUrl?: string;
  category?: ProductCategory;
  inStock?: boolean;
}

export interface ProductFilters {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  size?: ProductSize;
  color?: string;
}

export interface ProductSearchParams {
  query?: string;
  category?: ProductCategory;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductResponse {
  products: Product[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export enum ProductCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  BOOKS = 'books',
  HOME = 'home',
  SPORTS = 'sports',
  BEAUTY = 'beauty',
  TOYS = 'toys',
  AUTOMOTIVE = 'automotive'
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued'
}

export enum ProductSize {
  XS = 'xs',
  S = 's',
  M = 'm',
  L = 'l',
  XL = 'xl',
  XXL = 'xxl'
}

export function isProduct(obj: any): obj is Product {
  return obj && typeof obj === 'object' && 
         typeof obj.id === 'number' &&
         typeof obj.name === 'string' &&
         typeof obj.price === 'number';
}

export function isValidCategory(category: string): category is ProductCategory {
  return Object.values(ProductCategory).includes(category as ProductCategory);
} 