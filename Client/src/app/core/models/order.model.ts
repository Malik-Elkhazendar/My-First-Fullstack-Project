import { Product } from './product.model';
import { User } from './user.model';
import { AddressResponse, AddressSelection } from './address.model';

export interface OrderItem {
  id?: number;
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Updated to use AddressResponse for database compatibility
export interface ShippingAddress extends Omit<AddressResponse, 'type' | 'label' | 'isDefault' | 'isActive' | 'userId'> {
  // Inherits all AddressResponse properties except type-specific ones
}

export interface BillingAddress extends Omit<AddressResponse, 'type' | 'label' | 'isDefault' | 'isActive' | 'userId'> {
  // Inherits all AddressResponse properties except type-specific ones
}

export interface PaymentInfo {
  id?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  stripePaymentIntentId?: string; // For future Stripe integration
  stripeCustomerId?: string; // For customer management
  amount: number;
  currency: string;
  paidAt?: Date | string; // Support both Date and ISO string from NestJS
  refundedAt?: Date | string;
  refundAmount?: number;
  paymentMetadata?: Record<string, any>; // For additional payment data
}

export interface Order {
  id?: number;
  orderNumber: string;
  userId: number;
  user?: User;
  items: OrderItem[];
  status: OrderStatus;
  paymentInfo: PaymentInfo;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  // Address references for database relationships
  shippingAddressId?: number;
  billingAddressId?: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  trackingNumber?: string;
  trackingUrl?: string; // For direct tracking links
  estimatedDeliveryDate?: Date | string;
  actualDeliveryDate?: Date | string;
  createdAt: Date | string; // Support both Date and ISO string from NestJS
  updatedAt: Date | string;
  cancelledAt?: Date | string;
  cancellationReason?: string;
  // Additional fields for database compatibility
  version?: number; // For optimistic locking
  metadata?: Record<string, any>; // For extensibility
}

export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
  Failed = 'failed'
}

export enum PaymentMethod {
  CreditCard = 'credit_card',
  DebitCard = 'debit_card',
  PayPal = 'paypal',
  Stripe = 'stripe',
  BankTransfer = 'bank_transfer',
  CashOnDelivery = 'cash_on_delivery',
  ApplePay = 'apple_pay',
  GooglePay = 'google_pay'
}

export enum PaymentStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
  PartiallyRefunded = 'partially_refunded',
  RequiresAction = 'requires_action' // For 3D Secure, etc.
}

// Enhanced Request/Response DTOs for NestJS compatibility
export interface CreateOrderRequest {
  items: CreateOrderItemRequest[];
  addressSelection: AddressSelection; // Use saved addresses or new ones
  paymentMethod: PaymentMethod;
  notes?: string;
  couponCode?: string;
  saveShippingAddress?: boolean; // Option to save new address
  saveBillingAddress?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
  // Optional: include product snapshot for price consistency
  productSnapshot?: {
    name: string;
    price: number;
    imageUrl: string;
  };
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: Date | string;
  notes?: string;
  notifyCustomer?: boolean; // Whether to send notification
}

export interface CancelOrderRequest {
  reason: string;
  refundAmount?: number; // Partial refund option
  notifyCustomer?: boolean;
}

export interface RefundOrderRequest {
  amount: number;
  reason: string;
  refundMethod?: 'original' | 'store_credit';
  notifyCustomer?: boolean;
}

// Enhanced filter and pagination interfaces
export interface OrderFilters {
  status?: OrderStatus | OrderStatus[]; // Support multiple statuses
  paymentStatus?: PaymentStatus | PaymentStatus[];
  paymentMethod?: PaymentMethod | PaymentMethod[];
  dateFrom?: Date | string;
  dateTo?: Date | string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string; // Search in order number, customer name, etc.
  userId?: number; // Filter by specific user
  hasTracking?: boolean; // Orders with/without tracking
}

export interface OrderSortOptions {
  field: OrderSortField;
  direction: SortDirection;
}

export enum OrderSortField {
  OrderNumber = 'orderNumber',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  TotalAmount = 'totalAmount',
  Status = 'status',
  CustomerName = 'customerName',
  PaymentStatus = 'paymentStatus'
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export interface PaginatedOrderResponse {
  orders: Order[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  // Additional metadata for analytics
  totalRevenue?: number;
  averageOrderValue?: number;
}

// Enhanced order statistics for admin dashboard
export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPaymentStatus: Record<PaymentStatus, number>;
  recentOrders: Order[];
  topSellingProducts: Array<{
    product: Product;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  // Time-based analytics
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
}

// Enhanced order tracking information
export interface OrderTracking {
  orderId: number;
  orderNumber: string;
  trackingNumber: string;
  trackingUrl?: string;
  carrier: string;
  status: TrackingStatus;
  estimatedDelivery: Date | string;
  actualDelivery?: Date | string;
  trackingEvents: TrackingEvent[];
  // Additional tracking info
  shippingMethod: string;
  packageWeight?: number;
  packageDimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
}

export interface TrackingEvent {
  id: number;
  timestamp: Date | string;
  status: TrackingStatus;
  location: string;
  description: string;
  // Additional event data
  facilityType?: 'origin' | 'transit' | 'destination' | 'delivery';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export enum TrackingStatus {
  OrderPlaced = 'order_placed',
  OrderConfirmed = 'order_confirmed',
  InTransit = 'in_transit',
  OutForDelivery = 'out_for_delivery',
  Delivered = 'delivered',
  DeliveryAttempted = 'delivery_attempted',
  Exception = 'exception',
  Returned = 'returned'
}

// Enhanced validation interfaces
export interface OrderValidationResult {
  isValid: boolean;
  errors: OrderValidationError[];
  warnings?: OrderValidationWarning[]; // Non-blocking issues
}

export interface OrderValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface OrderValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Enhanced order summary for checkout
export interface OrderSummary {
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  shippingCost: number;
  discountAmount: number;
  discountCode?: string;
  totalAmount: number;
  estimatedDeliveryDate: Date | string;
  // Additional summary info
  itemCount: number;
  weight?: number;
  currency: string;
  // Shipping options
  availableShippingMethods?: ShippingMethod[];
  selectedShippingMethod?: ShippingMethod;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  cost: number;
  estimatedDays: number;
  carrier: string;
  trackingIncluded: boolean;
}

// Order export/import interfaces for data management
export interface OrderExportRequest {
  filters?: OrderFilters;
  format: 'csv' | 'xlsx' | 'json';
  includeItems?: boolean;
  includeAddresses?: boolean;
  includePaymentInfo?: boolean;
}

export interface OrderExportResponse {
  downloadUrl: string;
  expiresAt: Date | string;
  recordCount: number;
  fileSize: number;
}

// Bulk operations for admin
export interface BulkOrderUpdateRequest {
  orderIds: number[];
  updates: Partial<UpdateOrderStatusRequest>;
}

export interface BulkOrderUpdateResponse {
  successCount: number;
  failureCount: number;
  errors: Array<{
    orderId: number;
    error: string;
  }>;
}

// Order notifications
export interface OrderNotification {
  id: number;
  orderId: number;
  type: OrderNotificationType;
  recipient: string; // email or phone
  status: NotificationStatus;
  sentAt?: Date | string;
  deliveredAt?: Date | string;
  content: {
    subject: string;
    body: string;
    templateId?: string;
  };
}

export enum OrderNotificationType {
  OrderConfirmation = 'order_confirmation',
  PaymentConfirmation = 'payment_confirmation',
  OrderShipped = 'order_shipped',
  OrderDelivered = 'order_delivered',
  OrderCancelled = 'order_cancelled',
  OrderRefunded = 'order_refunded',
  DeliveryReminder = 'delivery_reminder'
}

export enum NotificationStatus {
  Pending = 'pending',
  Sent = 'sent',
  Delivered = 'delivered',
  Failed = 'failed',
  Bounced = 'bounced'
} 