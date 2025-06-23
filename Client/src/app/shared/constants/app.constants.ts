/**
 * Application-wide constants and configuration values
 * 
 * Centralized location for all application constants including
 * API endpoints, validation rules, UI settings, and business logic constants.
 * 
 * @example
 * ```typescript
 * import { APP_CONSTANTS } from '@shared/constants';
 * 
 * // Use validation constants
 * if (password.length < APP_CONSTANTS.VALIDATION.PASSWORD.MIN_LENGTH) {
 *   // Handle error
 * }
 * 
 * // Use API endpoints
 * const url = `${APP_CONSTANTS.API.BASE_URL}${APP_CONSTANTS.API.ENDPOINTS.PRODUCTS}`;
 * ```
 * 
 * @since 1.0.0
 * @author Fashion Forward Team
 */

/**
 * Application metadata and branding
 */
export const APP_INFO = {
  /** Application name */
  NAME: 'Fashion Forward',
  
  /** Application version */
  VERSION: '1.0.0',
  
  /** Application description */
  DESCRIPTION: 'Premium fashion e-commerce platform',
  
  /** Company information */
  COMPANY: {
    NAME: 'Fashion Forward Inc.',
    EMAIL: 'support@fashionforward.com',
    PHONE: '+1 (555) 123-4567',
    ADDRESS: '123 Fashion Ave, Style City, SC 12345'
  },
  
  /** Social media links */
  SOCIAL: {
    FACEBOOK: 'https://facebook.com/fashionforward',
    INSTAGRAM: 'https://instagram.com/fashionforward',
    TWITTER: 'https://twitter.com/fashionforward',
    PINTEREST: 'https://pinterest.com/fashionforward'
  }
} as const;

/**
 * API configuration constants
 */
export const API_CONFIG = {
  /** Base API URL */
  BASE_URL: '/api/v1',
  
  /** API endpoints */
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      PROFILE: '/auth/profile'
    },
    
    // Products
    PRODUCTS: {
      BASE: '/products',
      SEARCH: '/products/search',
      CATEGORIES: '/products/categories',
      FEATURED: '/products/featured',
      RELATED: '/products/related'
    },
    
    // Orders
    ORDERS: {
      BASE: '/orders',
      HISTORY: '/orders/history',
      TRACK: '/orders/track'
    },
    
    // Cart & Wishlist
    CART: '/cart',
    WISHLIST: '/wishlist',
    
    // User
    USER: {
      PROFILE: '/user/profile',
      ADDRESSES: '/user/addresses',
      PREFERENCES: '/user/preferences'
    },
    
    // Admin
    ADMIN: {
      DASHBOARD: '/admin/dashboard',
      USERS: '/admin/users',
      PRODUCTS: '/admin/products',
      ORDERS: '/admin/orders',
      ANALYTICS: '/admin/analytics'
    }
  },
  
  /** HTTP request timeouts (milliseconds) */
  TIMEOUTS: {
    DEFAULT: 10000,
    UPLOAD: 30000,
    LONG_RUNNING: 60000
  },
  
  /** Retry configuration */
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
    BACKOFF_MULTIPLIER: 2
  }
} as const;

/**
 * Validation rules and constraints
 */
export const VALIDATION_RULES = {
  /** User validation rules */
  USER: {
    FIRST_NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
      PATTERN: /^[a-zA-Z\s'-]+$/
    },
    LAST_NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
      PATTERN: /^[a-zA-Z\s'-]+$/
    },
    EMAIL: {
      MAX_LENGTH: 254,
      PATTERN: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    }
  },
  
  /** Password validation rules */
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  },
  
  /** Product validation rules */
  PRODUCT: {
    NAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 100
    },
    DESCRIPTION: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 2000
    },
    PRICE: {
      MIN: 0.01,
      MAX: 99999.99
    }
  },
  
  /** Order validation rules */
  ORDER: {
    MIN_ITEMS: 1,
    MAX_ITEMS: 50,
    NOTES: {
      MAX_LENGTH: 500
    }
  }
} as const;

/**
 * UI configuration constants
 */
export const UI_CONFIG = {
  /** Pagination settings */
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 12,
    PAGE_SIZE_OPTIONS: [6, 12, 24, 48],
    MAX_PAGE_SIZE: 100
  },
  
  /** Search configuration */
  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    DEBOUNCE_TIME: 300,
    MAX_RESULTS: 50
  },
  
  /** Image settings */
  IMAGES: {
    PLACEHOLDER: '/assets/images/placeholder.jpg',
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    THUMBNAIL_SIZE: 150,
    PRODUCT_IMAGE_SIZES: {
      SMALL: 200,
      MEDIUM: 400,
      LARGE: 800
    }
  },
  
  /** Loading states */
  LOADING: {
    DEBOUNCE_TIME: 200,
    MIN_DISPLAY_TIME: 500
  },
  
  /** Animation durations (milliseconds) */
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },
  
  /** Breakpoints (pixels) */
  BREAKPOINTS: {
    XS: 0,
    SM: 576,
    MD: 768,
    LG: 992,
    XL: 1200,
    XXL: 1400
  },
  
  /** Z-index layers */
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 1080
  }
} as const;

/**
 * Business logic constants
 */
export const BUSINESS_RULES = {
  /** Shopping cart rules */
  CART: {
    MAX_QUANTITY_PER_ITEM: 99,
    MAX_TOTAL_ITEMS: 100,
    SESSION_TIMEOUT: 30 * 60 * 1000 // 30 minutes
  },
  
  /** Shipping rules */
  SHIPPING: {
    FREE_SHIPPING_THRESHOLD: 75,
    STANDARD_RATE: 5.99,
    EXPRESS_RATE: 12.99,
    OVERNIGHT_RATE: 24.99,
    PROCESSING_DAYS: {
      STANDARD: 2,
      EXPRESS: 1,
      OVERNIGHT: 0
    },
    DELIVERY_DAYS: {
      STANDARD: 5,
      EXPRESS: 2,
      OVERNIGHT: 1
    }
  },
  
  /** Discount rules */
  DISCOUNTS: {
    MAX_PERCENTAGE: 90,
    MIN_ORDER_VALUE: 25,
    LOYALTY_TIERS: {
      BRONZE: { MIN_ORDERS: 5, DISCOUNT: 5 },
      SILVER: { MIN_ORDERS: 15, DISCOUNT: 10 },
      GOLD: { MIN_ORDERS: 30, DISCOUNT: 15 },
      PLATINUM: { MIN_ORDERS: 50, DISCOUNT: 20 }
    }
  },
  
  /** Return policy */
  RETURNS: {
    WINDOW_DAYS: 30,
    RESTOCKING_FEE: 0.15, // 15%
    EXCLUDED_CATEGORIES: ['underwear', 'swimwear', 'accessories']
  },
  
  /** Inventory rules */
  INVENTORY: {
    LOW_STOCK_THRESHOLD: 10,
    OUT_OF_STOCK_THRESHOLD: 0,
    REORDER_POINT: 5
  }
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  /** Authentication tokens */
  AUTH_TOKEN: 'ff_auth_token',
  REFRESH_TOKEN: 'ff_refresh_token',
  USER_DATA: 'ff_user_data',
  
  /** Shopping cart */
  CART_ITEMS: 'ff_cart_items',
  CART_TIMESTAMP: 'ff_cart_timestamp',
  
  /** User preferences */
  THEME: 'ff_theme',
  LANGUAGE: 'ff_language',
  CURRENCY: 'ff_currency',
  
  /** Search and filters */
  RECENT_SEARCHES: 'ff_recent_searches',
  SAVED_FILTERS: 'ff_saved_filters',
  
  /** Wishlist */
  WISHLIST_ITEMS: 'ff_wishlist_items',
  
  /** UI state */
  SIDEBAR_COLLAPSED: 'ff_sidebar_collapsed',
  GRID_VIEW_MODE: 'ff_grid_view_mode'
} as const;

/**
 * Error messages and codes
 */
export const ERROR_MESSAGES = {
  /** Generic errors */
  GENERIC: {
    UNKNOWN: 'An unexpected error occurred. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    TIMEOUT: 'Request timeout. Please try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    FORBIDDEN: 'Access denied.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'Server error. Please try again later.'
  },
  
  /** Authentication errors */
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    ACCOUNT_LOCKED: 'Account is temporarily locked. Please try again later.',
    EMAIL_NOT_VERIFIED: 'Please verify your email address.',
    PASSWORD_EXPIRED: 'Your password has expired. Please reset it.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.'
  },
  
  /** Validation errors */
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_PHONE: 'Please enter a valid phone number.',
    PASSWORD_TOO_WEAK: 'Password does not meet security requirements.',
    PASSWORDS_NOT_MATCH: 'Passwords do not match.'
  },
  
  /** Cart errors */
  CART: {
    ITEM_NOT_FOUND: 'Item not found in cart.',
    INSUFFICIENT_STOCK: 'Insufficient stock available.',
    MAX_QUANTITY_EXCEEDED: 'Maximum quantity per item exceeded.',
    CART_EMPTY: 'Your cart is empty.'
  },
  
  /** Payment errors */
  PAYMENT: {
    CARD_DECLINED: 'Your card was declined. Please try another payment method.',
    INSUFFICIENT_FUNDS: 'Insufficient funds.',
    INVALID_CARD: 'Invalid card information.',
    PROCESSING_ERROR: 'Payment processing error. Please try again.'
  }
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  /** Authentication */
  AUTH: {
    LOGIN_SUCCESS: 'Welcome back!',
    LOGOUT_SUCCESS: 'You have been logged out successfully.',
    REGISTRATION_SUCCESS: 'Account created successfully!',
    PASSWORD_RESET: 'Password reset successfully.'
  },
  
  /** Cart and orders */
  CART: {
    ITEM_ADDED: 'Item added to cart.',
    ITEM_REMOVED: 'Item removed from cart.',
    CART_CLEARED: 'Cart cleared successfully.'
  },
  
  /** Orders */
  ORDER: {
    PLACED: 'Order placed successfully!',
    CANCELLED: 'Order cancelled successfully.',
    UPDATED: 'Order updated successfully.'
  },
  
  /** Profile */
  PROFILE: {
    UPDATED: 'Profile updated successfully.',
    PASSWORD_CHANGED: 'Password changed successfully.',
    ADDRESS_SAVED: 'Address saved successfully.'
  }
} as const;

/**
 * Product categories and filters
 */
export const PRODUCT_CONFIG = {
  /** Available categories */
  CATEGORIES: [
    { id: 'all', name: 'All', slug: 'all' },
    { id: 'clothing', name: 'Clothing', slug: 'clothing' },
    { id: 'shoes', name: 'Shoes', slug: 'shoes' },
    { id: 'accessories', name: 'Accessories', slug: 'accessories' }
  ],
  
  /** Available sizes */
  SIZES: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  
  /** Available colors */
  COLORS: [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#FF0000' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Green', hex: '#008000' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Brown', hex: '#A52A2A' },
    { name: 'Navy', hex: '#000080' }
  ],
  
  /** Price ranges for filtering */
  PRICE_RANGES: [
    { min: 0, max: 25, label: 'Under $25' },
    { min: 25, max: 50, label: '$25 - $50' },
    { min: 50, max: 100, label: '$50 - $100' },
    { min: 100, max: 200, label: '$100 - $200' },
    { min: 200, max: Infinity, label: '$200+' }
  ],
  
  /** Sort options */
  SORT_OPTIONS: [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'price-asc', label: 'Price (Low to High)' },
    { value: 'price-desc', label: 'Price (High to Low)' },
    { value: 'rating-desc', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' },
    { value: 'popularity', label: 'Most Popular' }
  ]
} as const;

/**
 * Combined application constants
 */
export const APP_CONSTANTS = {
  APP_INFO,
  API_CONFIG,
  VALIDATION_RULES,
  UI_CONFIG,
  BUSINESS_RULES,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PRODUCT_CONFIG
} as const;

/**
 * Type definitions for constants
 */
export type AppConstants = typeof APP_CONSTANTS;
export type ApiEndpoints = typeof API_CONFIG.ENDPOINTS;
export type ValidationRules = typeof VALIDATION_RULES;
export type StorageKeys = typeof STORAGE_KEYS;
export type ErrorMessages = typeof ERROR_MESSAGES;
export type SuccessMessages = typeof SUCCESS_MESSAGES; 
 