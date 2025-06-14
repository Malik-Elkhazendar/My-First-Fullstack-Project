import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly placeholderImage = environment.defaultPlaceholderImage;
  
  // Common colors for product category placeholders
  private readonly categoryColors = {
    electronics: '#3498db',
    clothing: '#9b59b6',
    books: '#1abc9c',
    home: '#e67e22',
    beauty: '#e84393',
    default: '#34495e'
  };
  
  /**
   * Get the proper image URL - either from assets or external source
   * @param imagePath Path to the image
   * @returns Full path to the image
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) {
      return this.placeholderImage;
    }
    
    // If the image path is a full URL (starts with http or https), return it directly
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a relative path starting with 'assets', use it directly
    if (imagePath.startsWith('assets/')) {
      return imagePath;
    }
    
    // Otherwise, assume it's a product image in the assets folder
    return `${environment.imageStorageUrl}/${imagePath}`;
  }
  
  /**
   * Handle image loading errors
   * @param event The error event
   */
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    
    // Extract product name from alt text if available
    const productName = imgElement.alt || 'Product';
    
    // Generate a simple text-based SVG placeholder with the product name
    imgElement.src = this.generateTextPlaceholder(productName);
  }
  
  /**
   * Generate a simple text-based SVG placeholder
   * @param text Text to display in the placeholder
   * @param category Optional category for color coding
   * @returns Data URL for the SVG image
   */
  generateTextPlaceholder(text: string, category: string = 'default'): string {
    // Choose background color based on category
    const bgColor = this.categoryColors[category as keyof typeof this.categoryColors] || this.categoryColors.default;
    
    // Shorten text if needed and capitalize
    const displayText = text.length > 20 ? 
      text.substring(0, 17) + '...' : 
      text;
    
    // Create SVG with text
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
        <rect width="100%" height="100%" fill="${bgColor}" />
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">
          ${displayText}
        </text>
      </svg>
    `;
    
    // Convert SVG to data URL
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
} 