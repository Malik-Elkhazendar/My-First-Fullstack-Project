import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { ErrorHandlingService } from './services/error-handling.service';
import { LoadingService } from './services/loading.service';
import { FormValidationService } from './services/form-validation.service';
import { ProductService } from './services/product.service';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { WishlistService } from './services/wishlist.service';
import { OrderService } from './services/order.service';
import { AddressService } from './services/address.service';
import { AdminService } from './services/admin.service';
import { ImageService } from './services/image.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatSnackBarModule
  ],
  providers: [
    ErrorHandlingService,
    LoadingService,
    FormValidationService,
    ProductService,
    AuthService,
    CartService,
    WishlistService,
    OrderService,
    AddressService,
    AdminService,
    ImageService
  ]
})
export class CoreModule { 
  constructor() {
    // Optional: Add constructor guard to prevent multiple imports
    console.log('CoreModule initialized with enhanced error handling and loading services');
  }
}
