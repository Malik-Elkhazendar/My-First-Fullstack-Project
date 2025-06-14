import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  Order,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderFilters,
  OrderSortOptions,
  PaginatedOrderResponse,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  CancelOrderRequest,
  RefundOrderRequest,
  OrderStatistics,
  OrderTracking,
  OrderValidationResult,
  OrderSummary,
  OrderItem,
  ShippingAddress,
  BillingAddress,
  PaymentInfo,
  TrackingStatus
} from '../models/order.model';
import { Product } from '../models/product.model';
import { AddressSelection, AddressType } from '../models/address.model';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private ordersSubject = new BehaviorSubject<Order[]>([]);

  // Mock data for development (remove when backend is ready)
  private mockOrders: Order[] = [];

  constructor(
    private http: HttpClient,
    private productService: ProductService
  ) {
    this.initializeMockData();
  }

  // Public observables
  get loading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  get orders$(): Observable<Order[]> {
    return this.ordersSubject.asObservable();
  }

  // CRUD Operations
  getOrders(
    filters?: OrderFilters,
    page: number = 1,
    pageSize: number = 10,
    sortOptions?: OrderSortOptions
  ): Observable<PaginatedOrderResponse> {
    this.setLoading(true);

    // For now, return mock data. Replace with HTTP call when backend is ready
    return this.getMockOrders(filters, page, pageSize, sortOptions).pipe(
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );

    // Future HTTP implementation:
    /*
    const params = this.buildHttpParams(filters, page, pageSize, sortOptions);
    return this.http.get<PaginatedOrderResponse>(this.apiUrl, { params }).pipe(
      tap((response) => {
        this.ordersSubject.next(response.orders);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );
    */
  }

  getOrderById(id: number): Observable<Order> {
    this.setLoading(true);

    // Mock implementation
    const order = this.mockOrders.find(o => o.id === id);
    if (order) {
      this.setLoading(false);
      return of(order);
    }

    this.setLoading(false);
    return throwError(() => new Error('Order not found'));

    // Future HTTP implementation:
    /*
    return this.http.get<Order>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.setLoading(false)),
      catchError(this.handleError.bind(this))
    );
    */
  }

  createOrder(orderRequest: CreateOrderRequest): Observable<Order> {
    this.setLoading(true);

    // Validate order before creation
    const validationResult = this.validateOrder(orderRequest);
    if (!validationResult.isValid) {
      this.setLoading(false);
      return throwError(() => new Error(validationResult.errors[0].message));
    }

    // Get products to ensure we have the correct product data
    return this.productService.getProducts().pipe(
      map(products => {
        const newOrder = this.createMockOrder(orderRequest, products);
        this.mockOrders.unshift(newOrder);
        this.ordersSubject.next([...this.mockOrders]);
        this.setLoading(false);
        return newOrder;
      }),
      catchError(error => {
        this.setLoading(false);
        return throwError(() => error);
      })
    );

    // Future HTTP implementation:
    /*
    return this.http.post<Order>(this.apiUrl, orderRequest).pipe(
      tap((order) => {
        const currentOrders = this.ordersSubject.value;
        this.ordersSubject.next([order, ...currentOrders]);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );
    */
  }

  updateOrderStatus(id: number, updateRequest: UpdateOrderStatusRequest): Observable<Order> {
    this.setLoading(true);

    // Mock implementation
    const orderIndex = this.mockOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      this.setLoading(false);
      return throwError(() => new Error('Order not found'));
    }

    const updatedOrder = {
      ...this.mockOrders[orderIndex],
      status: updateRequest.status,
      trackingNumber: updateRequest.trackingNumber || this.mockOrders[orderIndex].trackingNumber,
      trackingUrl: updateRequest.trackingUrl || this.mockOrders[orderIndex].trackingUrl,
      estimatedDeliveryDate: updateRequest.estimatedDeliveryDate || this.mockOrders[orderIndex].estimatedDeliveryDate,
      notes: updateRequest.notes || this.mockOrders[orderIndex].notes,
      updatedAt: new Date().toISOString()
    };

    this.mockOrders[orderIndex] = updatedOrder;
    this.ordersSubject.next([...this.mockOrders]);
    this.setLoading(false);
    return of(updatedOrder);

    // Future HTTP implementation:
    /*
    return this.http.patch<Order>(`${this.apiUrl}/${id}/status`, updateRequest).pipe(
      tap((order) => {
        this.updateOrderInList(order);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );
    */
  }

  cancelOrder(id: number, cancelRequest?: CancelOrderRequest): Observable<Order> {
    this.setLoading(true);

    // Mock implementation
    const orderIndex = this.mockOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      this.setLoading(false);
      return throwError(() => new Error('Order not found'));
    }

    const updatedOrder = {
      ...this.mockOrders[orderIndex],
      status: OrderStatus.Cancelled,
      cancelledAt: new Date().toISOString(),
      cancellationReason: cancelRequest?.reason || 'Cancelled by user',
      updatedAt: new Date().toISOString()
    };

    this.mockOrders[orderIndex] = updatedOrder;
    this.ordersSubject.next([...this.mockOrders]);
    this.setLoading(false);
    return of(updatedOrder);

    // Future HTTP implementation:
    /*
    return this.http.post<Order>(`${this.apiUrl}/${id}/cancel`, cancelRequest).pipe(
      tap((order) => {
        this.updateOrderInList(order);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );
    */
  }

  refundOrder(id: number, refundRequest: RefundOrderRequest): Observable<Order> {
    this.setLoading(true);

    // Mock implementation
    const orderIndex = this.mockOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      this.setLoading(false);
      return throwError(() => new Error('Order not found'));
    }

    const updatedOrder = {
      ...this.mockOrders[orderIndex],
      status: OrderStatus.Refunded,
      paymentInfo: {
        ...this.mockOrders[orderIndex].paymentInfo,
        paymentStatus: PaymentStatus.Refunded,
        refundAmount: refundRequest.amount,
        refundedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    this.mockOrders[orderIndex] = updatedOrder;
    this.ordersSubject.next([...this.mockOrders]);
    this.setLoading(false);
    return of(updatedOrder);

    // Future HTTP implementation:
    /*
    return this.http.post<Order>(`${this.apiUrl}/${id}/refund`, refundRequest).pipe(
      tap((order) => {
        this.updateOrderInList(order);
        this.setLoading(false);
      }),
      catchError(this.handleError.bind(this))
    );
    */
  }

  getOrderTracking(id: number): Observable<OrderTracking> {
    const order = this.mockOrders.find(o => o.id === id);
    if (!order || !order.trackingNumber) {
      return throwError(() => new Error('Tracking information not available'));
    }

    const tracking: OrderTracking = {
      orderId: order.id!,
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      carrier: 'UPS',
      status: TrackingStatus.InTransit,
      estimatedDelivery: order.estimatedDeliveryDate || new Date(),
      shippingMethod: 'Standard Shipping',
      trackingEvents: []
    };

    return of(tracking);

    // Future HTTP implementation:
    /*
    return this.http.get<OrderTracking>(`${this.apiUrl}/${id}/tracking`).pipe(
      catchError(this.handleError.bind(this))
    );
    */
  }

  getOrderStatistics(): Observable<OrderStatistics> {
    const stats: OrderStatistics = {
      totalOrders: this.mockOrders.length,
      totalRevenue: this.mockOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: this.mockOrders.length > 0 ? 
        this.mockOrders.reduce((sum, order) => sum + order.totalAmount, 0) / this.mockOrders.length : 0,
      ordersByStatus: this.getOrdersByStatus(),
      ordersByPaymentStatus: this.getOrdersByPaymentStatus(),
      recentOrders: this.mockOrders.slice(0, 5),
      topSellingProducts: [],
      ordersToday: 0,
      ordersThisWeek: 0,
      ordersThisMonth: 0,
      revenueToday: 0,
      revenueThisWeek: 0,
      revenueThisMonth: 0
    };

    return of(stats);

    // Future HTTP implementation:
    /*
    return this.http.get<OrderStatistics>(`${this.apiUrl}/statistics`).pipe(
      catchError(this.handleError.bind(this))
    );
    */
  }

  calculateOrderSummary(items: OrderItem[]): OrderSummary {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = 0.08; // 8% tax rate
    const taxAmount = subtotal * taxRate;
    const shippingCost = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const discountAmount = 0;
    const totalAmount = subtotal + taxAmount + shippingCost - discountAmount;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal,
      taxAmount,
      taxRate,
      shippingCost,
      discountAmount,
      totalAmount,
      estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      itemCount,
      currency: 'USD'
    };
  }

  // Utility methods
  canCancelOrder(order: Order): boolean {
    return [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Processing].includes(order.status);
  }

  getOrderStatusDisplay(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: 'Pending',
      [OrderStatus.Confirmed]: 'Confirmed',
      [OrderStatus.Processing]: 'Processing',
      [OrderStatus.Shipped]: 'Shipped',
      [OrderStatus.Delivered]: 'Delivered',
      [OrderStatus.Cancelled]: 'Cancelled',
      [OrderStatus.Refunded]: 'Refunded',
      [OrderStatus.Failed]: 'Failed'
    };
    return statusMap[status] || status;
  }

  getOrderStatusColor(status: OrderStatus): string {
    const colorMap: Record<OrderStatus, string> = {
      [OrderStatus.Pending]: '#ff9800',
      [OrderStatus.Confirmed]: '#2196f3',
      [OrderStatus.Processing]: '#9c27b0',
      [OrderStatus.Shipped]: '#00bcd4',
      [OrderStatus.Delivered]: '#4caf50',
      [OrderStatus.Cancelled]: '#f44336',
      [OrderStatus.Refunded]: '#795548',
      [OrderStatus.Failed]: '#f44336'
    };
    return colorMap[status] || '#757575';
  }

  formatOrderNumber(orderNumber: string): string {
    return orderNumber.toUpperCase();
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

    console.error('OrderService Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  private buildHttpParams(
    filters?: OrderFilters,
    page: number = 1,
    pageSize: number = 10,
    sortOptions?: OrderSortOptions
  ): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          params = params.set('status', filters.status.join(','));
        } else {
          params = params.set('status', filters.status);
        }
      }
      if (filters.paymentStatus) {
        if (Array.isArray(filters.paymentStatus)) {
          params = params.set('paymentStatus', filters.paymentStatus.join(','));
        } else {
          params = params.set('paymentStatus', filters.paymentStatus);
        }
      }
      if (filters.dateFrom) {
        const dateFrom = typeof filters.dateFrom === 'string' ? filters.dateFrom : filters.dateFrom.toISOString();
        params = params.set('dateFrom', dateFrom);
      }
      if (filters.dateTo) {
        const dateTo = typeof filters.dateTo === 'string' ? filters.dateTo : filters.dateTo.toISOString();
        params = params.set('dateTo', dateTo);
      }
      if (filters.minAmount) params = params.set('minAmount', filters.minAmount.toString());
      if (filters.maxAmount) params = params.set('maxAmount', filters.maxAmount.toString());
      if (filters.searchTerm) params = params.set('searchTerm', filters.searchTerm);
      if (filters.userId) params = params.set('userId', filters.userId.toString());
      if (filters.hasTracking !== undefined) params = params.set('hasTracking', filters.hasTracking.toString());
    }

    if (sortOptions) {
      params = params.set('sortField', sortOptions.field);
      params = params.set('sortDirection', sortOptions.direction);
    }

    return params;
  }

  private validateOrder(orderRequest: CreateOrderRequest): OrderValidationResult {
    const errors: any[] = [];

    if (!orderRequest.items || orderRequest.items.length === 0) {
      errors.push({ field: 'items', message: 'Order must contain at least one item', code: 'REQUIRED' });
    }

    if (!orderRequest.addressSelection) {
      errors.push({ field: 'addressSelection', message: 'Address selection is required', code: 'REQUIRED' });
    } else {
      const { addressSelection } = orderRequest;
      
      // Check if shipping address is provided
      if (!addressSelection.shippingAddressId && !addressSelection.newShippingAddress) {
        errors.push({ field: 'shippingAddress', message: 'Shipping address is required', code: 'REQUIRED' });
      }
      
      // Check if billing address is provided
      if (!addressSelection.billingAddressId && !addressSelection.newBillingAddress && !addressSelection.useShippingAsBilling) {
        errors.push({ field: 'billingAddress', message: 'Billing address is required', code: 'REQUIRED' });
      }
    }

    if (!orderRequest.paymentMethod) {
      errors.push({ field: 'paymentMethod', message: 'Payment method is required', code: 'REQUIRED' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private getMockOrders(
    filters?: OrderFilters,
    page: number = 1,
    pageSize: number = 10,
    sortOptions?: OrderSortOptions
  ): Observable<PaginatedOrderResponse> {
    let filteredOrders = [...this.mockOrders];

    // Apply filters
    if (filters) {
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        filteredOrders = filteredOrders.filter(order => statuses.includes(order.status));
      }
      if (filters.paymentStatus) {
        const paymentStatuses = Array.isArray(filters.paymentStatus) ? filters.paymentStatus : [filters.paymentStatus];
        filteredOrders = filteredOrders.filter(order => paymentStatuses.includes(order.paymentInfo.paymentStatus));
      }
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.orderNumber.toLowerCase().includes(searchTerm) ||
          `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.toLowerCase().includes(searchTerm)
        );
      }
      if (filters.minAmount) {
        filteredOrders = filteredOrders.filter(order => order.totalAmount >= filters.minAmount!);
      }
      if (filters.maxAmount) {
        filteredOrders = filteredOrders.filter(order => order.totalAmount <= filters.maxAmount!);
      }
      if (filters.hasTracking !== undefined) {
        filteredOrders = filteredOrders.filter(order => 
          filters.hasTracking ? !!order.trackingNumber : !order.trackingNumber
        );
      }
    }

    // Apply sorting
    if (sortOptions) {
      filteredOrders.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortOptions.field) {
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'totalAmount':
            aValue = a.totalAmount;
            bValue = b.totalAmount;
            break;
          default:
            aValue = a.orderNumber;
            bValue = b.orderNumber;
        }

        if (sortOptions.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    const response: PaginatedOrderResponse = {
      orders: paginatedOrders,
      totalCount: filteredOrders.length,
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(filteredOrders.length / pageSize),
      hasNextPage: endIndex < filteredOrders.length,
      hasPreviousPage: page > 1,
      totalRevenue,
      averageOrderValue
    };

    return of(response);
  }

  private createMockOrder(request: CreateOrderRequest, products: Product[]): Order {
    const orderId = this.mockOrders.length + 1;
    const orderNumber = `ORD-${new Date().getFullYear()}-${orderId.toString().padStart(6, '0')}`;
    
    // Create mock addresses from address selection
    const shippingAddress = this.createMockShippingAddress(request.addressSelection);
    const billingAddress = this.createMockBillingAddress(request.addressSelection, shippingAddress);
    
    // Map order items with actual product data
    const orderItems = request.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      return {
        id: item.productId,
        productId: item.productId,
        product: product,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: item.quantity * product.price
      };
    });

    // Calculate totals using actual product prices
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = subtotal * 0.08;
    const shippingCost = subtotal > 50 ? 0 : 9.99;
    const discountAmount = 0;
    const totalAmount = subtotal + taxAmount + shippingCost - discountAmount;

    const order: Order = {
      id: orderId,
      orderNumber,
      userId: 1, // Mock user ID
      items: orderItems,
      status: OrderStatus.Pending,
      paymentInfo: {
        paymentMethod: request.paymentMethod,
        paymentStatus: PaymentStatus.Pending,
        amount: totalAmount,
        currency: 'USD'
      },
      shippingAddress,
      billingAddress,
      subtotal,
      taxAmount,
      shippingCost,
      discountAmount,
      totalAmount,
      notes: request.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return order;
  }

  private createMockShippingAddress(addressSelection: AddressSelection): any {
    if (addressSelection.newShippingAddress) {
      return {
        id: Math.floor(Math.random() * 1000),
        firstName: addressSelection.newShippingAddress.firstName,
        lastName: addressSelection.newShippingAddress.lastName,
        company: addressSelection.newShippingAddress.company,
        addressLine1: addressSelection.newShippingAddress.addressLine1,
        addressLine2: addressSelection.newShippingAddress.addressLine2,
        city: addressSelection.newShippingAddress.city,
        state: addressSelection.newShippingAddress.state,
        postalCode: addressSelection.newShippingAddress.postalCode,
        country: addressSelection.newShippingAddress.country,
        phoneNumber: addressSelection.newShippingAddress.phoneNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    // Mock address for existing address ID
    return {
      id: addressSelection.shippingAddressId || 1,
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private createMockBillingAddress(addressSelection: AddressSelection, shippingAddress: any): any {
    if (addressSelection.useShippingAsBilling) {
      return { ...shippingAddress };
    }
    
    if (addressSelection.newBillingAddress) {
      return {
        id: Math.floor(Math.random() * 1000),
        firstName: addressSelection.newBillingAddress.firstName,
        lastName: addressSelection.newBillingAddress.lastName,
        company: addressSelection.newBillingAddress.company,
        addressLine1: addressSelection.newBillingAddress.addressLine1,
        addressLine2: addressSelection.newBillingAddress.addressLine2,
        city: addressSelection.newBillingAddress.city,
        state: addressSelection.newBillingAddress.state,
        postalCode: addressSelection.newBillingAddress.postalCode,
        country: addressSelection.newBillingAddress.country,
        phoneNumber: addressSelection.newBillingAddress.phoneNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    // Mock address for existing address ID
    return {
      id: addressSelection.billingAddressId || 1,
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private getOrdersByStatus(): Record<OrderStatus, number> {
    const statusCounts: Record<OrderStatus, number> = {
      [OrderStatus.Pending]: 0,
      [OrderStatus.Confirmed]: 0,
      [OrderStatus.Processing]: 0,
      [OrderStatus.Shipped]: 0,
      [OrderStatus.Delivered]: 0,
      [OrderStatus.Cancelled]: 0,
      [OrderStatus.Refunded]: 0,
      [OrderStatus.Failed]: 0
    };

    this.mockOrders.forEach(order => {
      statusCounts[order.status]++;
    });

    return statusCounts;
  }

  private getOrdersByPaymentStatus(): Record<PaymentStatus, number> {
    const paymentStatusCounts: Record<PaymentStatus, number> = {
      [PaymentStatus.Pending]: 0,
      [PaymentStatus.Processing]: 0,
      [PaymentStatus.Completed]: 0,
      [PaymentStatus.Failed]: 0,
      [PaymentStatus.Cancelled]: 0,
      [PaymentStatus.Refunded]: 0,
      [PaymentStatus.PartiallyRefunded]: 0,
      [PaymentStatus.RequiresAction]: 0
    };

    this.mockOrders.forEach(order => {
      paymentStatusCounts[order.paymentInfo.paymentStatus]++;
    });

    return paymentStatusCounts;
  }

  private initializeMockData(): void {
    // Initialize with some mock orders using actual product data
    // We'll load products and create orders based on them
    this.productService.getProducts().subscribe(products => {
      if (products.length === 0) return;

      this.mockOrders = [
        {
          id: 1,
          orderNumber: 'ORD-2024-000001',
          userId: 1,
          items: [
            {
              id: 1,
              productId: 1,
              product: products[0], // Summer Dress
              quantity: 1,
              unitPrice: products[0].price,
              totalPrice: products[0].price
            }
          ],
          status: OrderStatus.Delivered,
          paymentInfo: {
            paymentMethod: PaymentMethod.CreditCard,
            paymentStatus: PaymentStatus.Completed,
            amount: products[0].price * 1.08 + (products[0].price > 50 ? 0 : 9.99),
            currency: 'USD',
            paidAt: new Date().toISOString()
          },
          shippingAddress: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          billingAddress: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          subtotal: products[0].price,
          taxAmount: products[0].price * 0.08,
          shippingCost: products[0].price > 50 ? 0 : 9.99,
          discountAmount: 0,
          totalAmount: products[0].price * 1.08 + (products[0].price > 50 ? 0 : 9.99),
          trackingNumber: 'TRK123456789',
          trackingUrl: 'https://tracking.example.com/TRK123456789',
          estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          orderNumber: 'ORD-2024-000002',
          userId: 1,
          items: [
            {
              id: 2,
              productId: 3,
              product: products[2], // Denim Jeans
              quantity: 1,
              unitPrice: products[2].price,
              totalPrice: products[2].price
            }
          ],
          status: OrderStatus.Processing,
          paymentInfo: {
            paymentMethod: PaymentMethod.Stripe,
            paymentStatus: PaymentStatus.Completed,
            amount: products[2].price * 1.08 + (products[2].price > 50 ? 0 : 9.99),
            currency: 'USD',
            paidAt: new Date().toISOString(),
            stripePaymentIntentId: 'pi_1234567890'
          },
          shippingAddress: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            addressLine1: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          billingAddress: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            addressLine1: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          subtotal: products[2].price,
          taxAmount: products[2].price * 0.08,
          shippingCost: products[2].price > 50 ? 0 : 9.99,
          discountAmount: 0,
          totalAmount: products[2].price * 1.08 + (products[2].price > 50 ? 0 : 9.99),
          estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Generate additional mock orders using actual products
      this.generateAdditionalMockOrders(products);
    });
  }

  private generateAdditionalMockOrders(products: Product[]): void {

    // Generate additional mock orders for pagination testing
    const statuses = [OrderStatus.Pending, OrderStatus.Confirmed, OrderStatus.Processing, OrderStatus.Shipped, OrderStatus.Delivered, OrderStatus.Cancelled];
    const paymentMethods = [PaymentMethod.CreditCard, PaymentMethod.Stripe, PaymentMethod.PayPal];
    const paymentStatuses = [PaymentStatus.Pending, PaymentStatus.Processing, PaymentStatus.Completed, PaymentStatus.Failed];
    const customers = [
      { firstName: 'Alice', lastName: 'Johnson', city: 'Chicago', state: 'IL', postalCode: '60601' },
      { firstName: 'Bob', lastName: 'Wilson', city: 'Houston', state: 'TX', postalCode: '77001' },
      { firstName: 'Carol', lastName: 'Brown', city: 'Phoenix', state: 'AZ', postalCode: '85001' },
      { firstName: 'David', lastName: 'Davis', city: 'Philadelphia', state: 'PA', postalCode: '19101' },
      { firstName: 'Emma', lastName: 'Miller', city: 'San Antonio', state: 'TX', postalCode: '78201' },
      { firstName: 'Frank', lastName: 'Garcia', city: 'San Diego', state: 'CA', postalCode: '92101' }
    ];

    // Generate 23 more orders (for a total of 25)
    for (let i = 3; i <= 25; i++) {
      const product = products[(i - 3) % products.length];
      const customer = customers[(i - 3) % customers.length];
      const status = statuses[(i - 3) % statuses.length];
      const paymentMethod = paymentMethods[(i - 3) % paymentMethods.length];
      const paymentStatus = paymentStatuses[(i - 3) % paymentStatuses.length];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const subtotal = product.price * quantity;
      const taxAmount = subtotal * 0.08;
      const shippingCost = subtotal > 50 ? 0 : 9.99;
      const totalAmount = subtotal + taxAmount + shippingCost;
      const daysAgo = Math.floor(Math.random() * 30) + 1;

      this.mockOrders.push({
        id: i,
        orderNumber: `ORD-2024-${i.toString().padStart(6, '0')}`,
        userId: 1,
        items: [
          {
            id: i,
            productId: product.id,
            product: product,
            quantity: quantity,
            unitPrice: product.price,
            totalPrice: subtotal
          }
        ],
        status: status,
        paymentInfo: {
          paymentMethod: paymentMethod,
          paymentStatus: paymentStatus,
          amount: totalAmount,
          currency: 'USD',
          paidAt: paymentStatus === PaymentStatus.Completed ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString() : undefined
        },
        shippingAddress: {
          id: i,
          firstName: customer.firstName,
          lastName: customer.lastName,
          addressLine1: `${100 + i} ${customer.lastName} St`,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postalCode,
          country: 'US',
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        },
        billingAddress: {
          id: i,
          firstName: customer.firstName,
          lastName: customer.lastName,
          addressLine1: `${100 + i} ${customer.lastName} St`,
          city: customer.city,
          state: customer.state,
          postalCode: customer.postalCode,
          country: 'US',
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        },
        subtotal: subtotal,
        taxAmount: taxAmount,
        shippingCost: shippingCost,
        discountAmount: 0,
        totalAmount: totalAmount,
        trackingNumber: status === OrderStatus.Shipped || status === OrderStatus.Delivered ? `TRK${i.toString().padStart(9, '0')}` : undefined,
        trackingUrl: status === OrderStatus.Shipped || status === OrderStatus.Delivered ? `https://tracking.example.com/TRK${i.toString().padStart(9, '0')}` : undefined,
        estimatedDeliveryDate: status !== OrderStatus.Delivered && status !== OrderStatus.Cancelled ? new Date(Date.now() + Math.floor(Math.random() * 7 + 1) * 24 * 60 * 60 * 1000).toISOString() : undefined,
        actualDeliveryDate: status === OrderStatus.Delivered ? new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000).toISOString() : undefined,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.floor(daysAgo / 2) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }

  private updateOrderInList(updatedOrder: Order): void {
    const currentOrders = this.ordersSubject.value;
    const index = currentOrders.findIndex(order => order.id === updatedOrder.id);
    if (index !== -1) {
      currentOrders[index] = updatedOrder;
      this.ordersSubject.next([...currentOrders]);
    }
  }
} 