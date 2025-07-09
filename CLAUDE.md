# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Frontend (Angular - Client directory)
```bash
# Development server
cd Client && ng serve

# Build project
cd Client && ng build

# Run tests
cd Client && ng test

# Lint code
cd Client && ng lint

# Watch build
cd Client && ng build --watch --configuration development
```

### Backend (NestJS - Server directory)
```bash
# Development server
cd Server && npm run start:dev

# Build project
cd Server && npm run build

# Run tests
cd Server && npm test

# Run test coverage
cd Server && npm run test:cov

# Run e2e tests
cd Server && npm run test:e2e

# Lint code
cd Server && npm run lint

# Format code
cd Server && npm run format

# Start production
cd Server && npm run start:prod
```

## Architecture Overview

### Frontend Architecture (Angular)
- **Modular structure** with feature-based organization
- **Core module** (`Client/src/app/core/`) contains singleton services:
  - Authentication, cart, product, order, wishlist, admin services
  - Error handling and loading services
  - Guards and interceptors
- **Feature modules** (`Client/src/app/features/`) for:
  - Admin dashboard with user/product/order management
  - Authentication (login/register)
  - Shopping cart and checkout
  - Product catalog and details
  - User profile and order history
  - Wishlist management
- **Shared module** (`Client/src/app/shared/`) contains:
  - Reusable components (product cards, dialogs, etc.)
  - Pipes for formatting
  - Utility functions
  - Constants
- **Layout components** (`Client/src/app/layout/`) for header, footer, navigation

### Backend Architecture (NestJS)
- **MongoDB** with Mongoose ODM
- **JWT-based authentication** with Passport strategies
- **Modular structure** with feature-based organization:
  - Auth module with JWT, local strategies, guards, decorators
  - Configuration service with environment-specific settings
  - Logging service with file and console transports
- **Configuration system** using environment files:
  - Development: `.env.development`
  - Production: `.env.production`
- **Structured logging** with performance metrics and environment-aware formatting

## Key Configuration Files

### Environment Configuration
- **Client environments**: `Client/src/environments/environment.ts` and `environment.prod.ts`
- **Server environment**: `Server/.env.development` and `Server/.env.production`
- Frontend environment includes feature flags, API endpoints, security settings, and UI configuration

### Database
- **MongoDB Atlas** connection configured in `Server/src/app.module.ts`
- Connection pooling and timeout settings configured via environment variables

## Development Practices

### Frontend
- **Angular Material** for UI components with magenta-violet theme
- **SCSS** for component styling
- **TypeScript** strict mode enabled
- **Lazy loading** for feature modules
- **Reactive forms** with custom validation services

### Backend
- **Dependency injection** throughout with NestJS container
- **DTO validation** using class-validator
- **Global validation pipe** with whitelist and transform
- **CORS** configured for development and production
- **Structured error handling** with custom logging

## API Integration
- **Base URL**: `http://localhost:3000/api` (development)
- **Main endpoints**: `/auth`, `/products`, `/orders`, `/users`, `/cart`, `/wishlist`
- **JWT token storage**: Local storage with configurable expiration
- **HTTP interceptors** for authentication and error handling

## Testing
- **Frontend**: Jasmine and Karma for unit tests
- **Backend**: Jest for unit and e2e tests
- Test files follow `.spec.ts` naming convention
- Coverage reports generated in `coverage/` directory

## Security Features
- **JWT authentication** with refresh token support
- **Password hashing** with bcrypt
- **Input validation** with class-validator
- **CORS** configuration
- **Environment-based security settings**

## Security Best Practices - CRITICAL

### Environment Variables Security
- **NEVER** commit `.env.development`, `.env.production` files to git
- **ALWAYS** use `.env.example` files with placeholder values
- **NEVER** hardcode secrets in docker-compose.yml files
- Use `env_file` directive in docker-compose to load from .env files
- Generate secure JWT secrets using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Database Security
- **NEVER** expose MongoDB credentials in code or config files
- Use connection pooling and timeout settings for security
- Enable MongoDB authentication and use dedicated database users

### Docker Security
- Use `env_file` to load environment variables securely
- **NEVER** include sensitive data directly in Dockerfile or docker-compose.yml
- Use non-root users in production containers
- Regularly update base images

### Code Security
- **NEVER** log sensitive information (passwords, tokens, API keys)
- Enable LOG_MASK_SENSITIVE=true to automatically mask sensitive data
- Use bcrypt with appropriate rounds (12+) for password hashing
- Implement rate limiting to prevent abuse
- Validate and sanitize all user inputs

### Git Security Checklist
Before committing, verify:
- [ ] No `.env.development` or `.env.production` files in git status
- [ ] No hardcoded secrets, passwords, or API keys in code
- [ ] All sensitive environment variables use placeholders in example files
- [ ] Docker configurations use env_file, not hardcoded values

## Performance Optimizations
- **Lazy loading** for Angular feature modules
- **MongoDB connection pooling** with configurable settings
- **Image optimization** with size limits and quality settings
- **Caching strategies** for API responses

## Git Workflow - Commit and Push After Changes

**IMPORTANT**: After any modification to the codebase, follow this workflow:

1. **Make code changes**
2. **Verify no errors** by running:
   - Frontend check: `cd Client && pnpm build`
   - Backend check: `cd Server && npm run build`
   - Run tests if applicable: `pnpm test` or `npm test`
3. **Only if NO errors exist**, then commit and push:
   ```bash
   git add .
   git commit -m "Description of changes made"
   git push origin main
   ```
4. **If errors exist**, fix them first before committing

This ensures every commit on main branch is in a working state and provides safe restore points.



