# Image Management Guidelines

## Directory Structure

- **products/** - Store all product images here
- **categories/** - Store category images here
- **ui/** - Store UI elements and icons here

## Naming Conventions

Use consistent naming patterns for easier management:

- Product images: `product-[id]-[view].jpg` (e.g., `product-1-main.jpg`, `product-1-thumbnail.jpg`)
- Category images: `category-[name].jpg` (e.g., `category-electronics.jpg`)
- UI elements: `ui-[element-name].svg` (e.g., `ui-cart-icon.svg`)

## Image Optimization

Before adding images to the project:

1. Resize images to appropriate dimensions:
   - Product images: 800x600px (main), 300x200px (thumbnails)
   - Category images: 600x400px
   - Banner images: 1200x400px

2. Compress images to reduce file size:
   - Use tools like [TinyPNG](https://tinypng.com/) or [Squoosh](https://squoosh.app/)
   - Target file sizes:
     - JPG/PNG: < 100KB for thumbnails, < 300KB for main images
     - SVG: < 30KB

## Using Images in Components

When referencing images in components, use the `ImageService` which provides:

- Proper path resolution
- Fallback images when the main image fails to load
- Responsive image handling

Example usage:

```typescript
import { ImageService } from 'src/app/core/services/image.service';

constructor(private imageService: ImageService) {}

getImageUrl(path: string): string {
  return this.imageService.getImageUrl(path);
}
```

## Environment Configuration

Image storage paths are configured in the environment files:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

To change the location of images (for example, to use a CDN), update the `imageStorageUrl` property.

## Placeholder Images

The file `placeholder.jpg` is used when:
- No image is provided
- An image fails to load
- A product is out of stock (optional) 