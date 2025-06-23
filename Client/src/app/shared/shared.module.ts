import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageGuideComponent } from './components/image-guide/image-guide.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { UserMenuComponent } from './components/user-menu/user-menu.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ImageGuideComponent,
    ProductCardComponent,
    UserMenuComponent
  ],
  exports: [
    ImageGuideComponent,
    ProductCardComponent,
    UserMenuComponent
  ]
})
export class SharedModule { }
