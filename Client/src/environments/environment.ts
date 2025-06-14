export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  imageStoragePath: '/assets/images',
  imageStorageUrl: 'http://localhost:4200/assets/images',
  defaultPlaceholderImage: '/assets/images/placeholder.jpg',
  stripePublishableKey: '',
  enableMockData: true,
  logLevel: 'debug',
  features: {
    enableAddressValidation: true,
    enableOrderTracking: true,
    enableNotifications: true,
    enableAnalytics: false
  }
}; 