/**
 * Development Environment Configuration
 * 
 * This file contains all environment-specific settings for the development build.
 * Settings are organized by feature area for better maintainability.
 */
export const environment = {
  // Core application settings
  production: false,
  environment: 'development',
  version: '1.0.0',
  
  // API Configuration
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    endpoints: {
      auth: '/auth',
      products: '/products',
      orders: '/orders',
      users: '/users',
      cart: '/cart',
      wishlist: '/wishlist'
    }
  },
  
  // Image and Media Configuration
  media: {
    imageStoragePath: '/assets/images',
    imageStorageUrl: '/assets/images',
    defaultPlaceholderImage: '/assets/images/placeholder.jpg',
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    thumbnailSizes: {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    },
    maxImageSize: 5 * 1024 * 1024, // 5MB
    imageQuality: 0.8
  },
  
  // Third-party Services
  services: {
    stripe: {
      publishableKey: '',
      apiVersion: '2022-11-15'
    },
    analytics: {
      googleAnalyticsId: '',
      enabled: false
    },
    maps: {
      googleMapsApiKey: '',
      enabled: true
    }
  },
  
  // Feature Flags
  features: {
    enableMockData: true,
    enableAddressValidation: true,
    enableOrderTracking: true,
    enableNotifications: true,
    enableAnalytics: false,
    enablePaymentGateway: false,
    enableRealTimeUpdates: false,
    enableAdvancedSearch: true,
    enableWishlist: true,
    enableProductReviews: true
  },
  
  // Security Configuration
  security: {
    jwtTokenKey: 'auth_token',
    tokenExpirationTime: 24 * 60 * 60 * 1000, // 24 hours
    passwordMinLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    enableCsrfProtection: true
  },
  
  // Logging Configuration
  logging: {
    level: 'debug', // 'error' | 'warn' | 'info' | 'debug'
    enableConsoleLogging: true,
    enableRemoteLogging: false,
    remoteLoggingEndpoint: '',
    logRetentionDays: 7
  },
  
  // UI Configuration
  ui: {
    theme: 'light', // 'light' | 'dark' | 'auto'
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h', // '12h' | '24h'
    pagination: {
      defaultPageSize: 12,
      pageSizeOptions: [12, 24, 48, 96]
    },
    notifications: {
      duration: 3000, // 3 seconds
      position: 'top-right' // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    }
  },
  
  // Performance Configuration
  performance: {
    enableServiceWorker: false,
    enableLazyLoading: true,
    enableImageOptimization: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    debounceTime: 300 // milliseconds
  },
  
  // Development Tools
  development: {
    enableDebugMode: true,
    enableMockAPI: true,
    showPerformanceMetrics: true,
    enableHotReload: true
  }
}; 