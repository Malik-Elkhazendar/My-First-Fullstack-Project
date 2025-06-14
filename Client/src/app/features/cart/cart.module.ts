import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CartRoutingModule } from './cart-routing.module';
import { CartListComponent } from './cart-list/cart-list.component';

@NgModule({
  imports: [
    CommonModule,
    CartRoutingModule,
    CartListComponent
  ]
})
export class CartModule { }
