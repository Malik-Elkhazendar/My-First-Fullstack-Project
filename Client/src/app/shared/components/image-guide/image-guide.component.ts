import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../../core/services/image.service';

@Component({
  selector: 'app-image-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-guide.component.html',
  styleUrls: ['./image-guide.component.scss']
})
export class ImageGuideComponent {
  examples = [
    {
      title: 'Elegant Summer Dress',
      description: 'Flowing midi dress perfect for summer occasions',
      path: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1000&auto=format&fit=crop'
    },
    {
      title: 'Designer Handbag',
      description: 'Elegant leather handbag with gold-tone hardware',
      path: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop'
    },
    {
      title: 'Classic Leather Heels',
      description: 'Elegant pointed-toe heels in genuine leather',
      path: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1000&auto=format&fit=crop'
    },
    {
      title: 'Tailored Suit Jacket',
      description: 'Modern fit suit jacket in premium wool blend',
      path: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop'
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
      description: 'SVG placeholder for Fashion',
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