export interface Address {
  id?: number;
  userId?: number;
  type: AddressType;
  label: string; // e.g., "Home", "Work", "Billing Address"
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum AddressType {
  Shipping = 'shipping',
  Billing = 'billing',
  Both = 'both'
}

// For backward compatibility with existing order system
export interface ShippingAddress extends Omit<Address, 'type' | 'label' | 'isDefault' | 'isActive'> {
  // Inherits all Address properties except type-specific ones
}

export interface BillingAddress extends Omit<Address, 'type' | 'label' | 'isDefault' | 'isActive'> {
  // Inherits all Address properties except type-specific ones
}

// Request/Response DTOs for NestJS compatibility
export interface CreateAddressRequest {
  type: AddressType;
  label: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {
  id: number;
}

export interface AddressResponse {
  id: number;
  userId: number;
  type: AddressType;
  label: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string; // ISO string from NestJS
  updatedAt: string; // ISO string from NestJS
}

// Address validation
export interface AddressValidationResult {
  isValid: boolean;
  errors: AddressValidationError[];
  suggestions?: AddressSuggestion[];
}

export interface AddressValidationError {
  field: string;
  message: string;
  code: string;
}

export interface AddressSuggestion {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  confidence: number; // 0-1
}

// Address filters for listing
export interface AddressFilters {
  type?: AddressType;
  isDefault?: boolean;
  searchTerm?: string;
}

// Pagination for addresses
export interface PaginatedAddressResponse {
  addresses: AddressResponse[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Address selection for orders
export interface AddressSelection {
  shippingAddressId?: number;
  billingAddressId?: number;
  useShippingAsBilling?: boolean;
  newShippingAddress?: CreateAddressRequest;
  newBillingAddress?: CreateAddressRequest;
}

// Country and state data for forms
export interface Country {
  code: string;
  name: string;
  states?: State[];
}

export interface State {
  code: string;
  name: string;
}

// Address book summary
export interface AddressBookSummary {
  totalAddresses: number;
  defaultShippingAddress?: AddressResponse;
  defaultBillingAddress?: AddressResponse;
  recentAddresses: AddressResponse[];
} 