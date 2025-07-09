# Fashion Forward - Full-Stack E-Commerce Platform
# Fashion Forward - Full-Stack E-Commerce Platform

A modern, responsive e-commerce application built with Angular and NestJS, featuring a complete shopping experience with product management, cart functionality, order processing, and user authentication.

## 🚀 Features

### Frontend (Angular 17)
- **Product Catalog**: Browse and search through fashion items with filtering and sorting
- **Product Details**: Detailed product pages with image galleries and specifications
- **Shopping Cart**: Add/remove items, quantity management, and real-time total calculations
- **User Authentication**: Login, registration, and profile management
- **Order Management**: Complete order history with status tracking
- **Address Management**: Save and manage multiple shipping/billing addresses
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI/UX**: Clean, intuitive interface with smooth animations

### Backend (NestJS)
- **RESTful API**: Well-structured endpoints for all business operations
- **Authentication & Authorization**: JWT-based security with role management
- **Database Integration**: TypeORM with PostgreSQL for data persistence
- **Order Processing**: Complete order lifecycle management
- **File Upload**: Image handling for product catalogs
- **Validation**: Comprehensive input validation and error handling

## 🛠️ Technology Stack

### Frontend
- **Angular 17** - Modern TypeScript framework
- **Tailwind CSS** - Utility-first CSS framework
- **Angular Material** - UI component library
- **RxJS** - Reactive programming with observables
- **TypeScript** - Type-safe development

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeORM** - Object-relational mapping
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Class Validator** - Input validation

### Development Tools
- **Git** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Angular CLI** - Development tooling

## 📁 Project Structure

```
E-Commerce-Fullstack/
├── Client/                     # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Core services and models
│   │   │   ├── features/      # Feature modules
│   │   │   ├── shared/        # Shared components
│   │   │   └── layouts/       # Layout components
│   │   ├── assets/            # Static assets
│   │   └── environments/      # Environment configurations
│   ├── angular.json
│   ├── package.json
│   └── tailwind.config.js
├── Server/                     # NestJS Backend
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   ├── common/            # Shared utilities
│   │   ├── config/            # Configuration files
│   │   └── database/          # Database configurations
│   ├── package.json
│   └── nest-cli.json
└── README.md
```

## 🎯 Key Features Implemented

### Product Management
- Dynamic product catalog with real-time data
- Advanced filtering and search capabilities
- Product details with image galleries
- Category-based organization

### Shopping Experience
- Intuitive shopping cart with persistent storage
- Real-time price calculations including tax and shipping
- Multiple payment method support
- Guest and authenticated user checkout

### Order Processing
- Complete order lifecycle management
- Order status tracking and updates
- Order history with detailed views
- Email notifications for order updates

### User Management
- Secure user authentication and authorization
- Profile management with address book
- Order history and account settings
- Role-based access control

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

### Frontend Setup
```bash
cd Client
npm install
ng serve
```

### Backend Setup
```bash
cd Server
npm install
npm run start:dev
```

## 🌟 Architecture Highlights

### Frontend Architecture
- **Modular Design**: Feature-based module organization
- **Service Layer**: Centralized business logic and API communication
- **State Management**: RxJS observables for reactive data flow
- **Component Architecture**: Reusable, maintainable components
- **Type Safety**: Full TypeScript implementation

### Backend Architecture
- **Layered Architecture**: Controllers, services, and repositories
- **Dependency Injection**: NestJS built-in DI container
- **Database Abstraction**: TypeORM for database operations
- **Security**: JWT authentication with guards and decorators
- **Validation**: DTO-based request validation

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile devices (320px - 767px)

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- SQL injection prevention

## 🚀 Performance Optimizations

- Lazy loading for feature modules
- OnPush change detection strategy
- Image optimization and lazy loading
- Database query optimization
- Caching strategies

## 📈 Future Enhancements

- Payment gateway integration (Stripe, PayPal)
- Real-time notifications with WebSockets
- Advanced analytics dashboard
- Multi-language support
- Progressive Web App (PWA) features
- Microservices architecture migration

## 👨‍💻 Developer

**Malik Elkhazendar**
- Senior Full-Stack Developer
- Expertise in Angular, NestJS, and modern web technologies
- Focus on scalable, maintainable, and user-centric applications

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*This project demonstrates proficiency in modern full-stack development practices, including clean architecture, responsive design, security best practices, and scalable code organization.*
