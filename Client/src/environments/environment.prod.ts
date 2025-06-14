export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',
  imageStoragePath: '/assets/images',
  imageStorageUrl: 'https://your-domain.com/assets/images',
  defaultPlaceholderImage: '/assets/images/placeholder.jpg',
  stripePublishableKey: '',
  enableMockData: false,
  logLevel: 'error',
  features: {
    enableAddressValidation: true,
    enableOrderTracking: true,
    enableNotifications: true,
    enableAnalytics: true
  }
}; 