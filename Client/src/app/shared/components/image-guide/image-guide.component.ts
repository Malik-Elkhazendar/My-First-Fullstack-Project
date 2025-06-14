import { Component } from '@angular/core';
import { ImageService } from '../../../core/services/image.service';

@Component({
  selector: 'app-image-guide',
  templateUrl: './image-guide.component.html',
  styleUrls: ['./image-guide.component.scss']
})
export class ImageGuideComponent {
  examples = [
    {
      title: 'Smartphone X',
      description: 'High-quality smartphone image from Unsplash',
      path: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1000&auto=format&fit=crop'
    },
    {
      title: 'Laptop Pro',
      description: 'Professional laptop for work and gaming',
      path: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1000&auto=format&fit=crop'
    },
    {
      title: 'Wireless Headphones',
      description: 'Premium sound quality with noise cancellation',
      path: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=1000&auto=format&fit=crop'
    },
    {
      title: 'Smartwatch',
      description: 'Track your fitness and stay connected',
      path: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'
    }
  ];

  // Additional examples for demonstration purposes
  additionalExamples = [
    {
      title: 'Missing Image',
      description: 'Image that fails to load (demonstrates fallback)',
      path: 'non-existent-image.jpg'
    },
    {
      title: 'Generated Placeholder',
      description: 'SVG placeholder for Electronics',
      path: ''
    }
  ];

  constructor(private imageService: ImageService) {}

  getImageUrl(path: string): string {
    return this.imageService.getImageUrl(path);
  }

  handleImageError(event: Event): void {
    this.imageService.handleImageError(event);
  }

  getGeneratedPlaceholder(category: string): string {
    return this.imageService.generateTextPlaceholder('Custom Placeholder', category);
  }
} 