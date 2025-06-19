import { Product } from './product.model';

export interface WishlistItem {
  id: string;
  product: Product;
  dateAdded: Date;
}

export interface Wishlist {
  items: WishlistItem[];
  totalItems: number;
} 