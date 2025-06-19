export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  status: OrderStatus;
  total: number;
  itemCount?: number;
}

export enum OrderStatus {
  Pending = 'pending',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled'
}

export interface AdminNavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  active?: boolean;
} 