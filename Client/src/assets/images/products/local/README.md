# Product Images

This directory contains all local product images used in the application.

## Adding Product Images

1. **Prepare your images**:
   - Use high-quality product images with a white or transparent background
   - Recommended dimensions: 800x600 pixels
   - Format: JPG or PNG (use PNG for images requiring transparency)
   - Optimize file size (aim for <100KB per image)

2. **Naming convention**:
   - Use descriptive, lowercase names with hyphens
   - Example: `smartphone-x-front.jpg`, `laptop-pro-open.jpg`

3. **Add images to this directory**:
   - Place all product images directly in this folder
   - For products with multiple views, use suffixes like `-front`, `-back`, `-side`

4. **Update the product service**:
   - In `src/app/core/services/products/product.service.ts`
   - Update the `imageUrl` property to match your image filename

## Example Product Image Setup

```typescript
{
  id: 1,
  name: 'Smartphone X',
  // ...other properties
  imageUrl: 'assets/images/products/local/smartphone-x-front.jpg',
}
```

## Troubleshooting

If images don't appear:
- Verify the path is correct
- Check that the image file exists in this directory
- Make sure the image format is supported (JPG, PNG, WebP)
- Confirm the file name matches exactly (case-sensitive)

The application has fallback handling that will display a placeholder if an image can't be found. 