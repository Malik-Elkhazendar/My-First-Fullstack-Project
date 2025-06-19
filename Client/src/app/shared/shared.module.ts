import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { ImageGuideComponent } from './components/image-guide/image-guide.component';
import { UserMenuComponent } from './components/user-menu/user-menu.component';

@NgModule({
  declarations: [
    ProductCardComponent,
    ImageGuideComponent
  ],
  imports: [
    CommonModule,
    UserMenuComponent
  ],
  exports: [
    ProductCardComponent,
    ImageGuideComponent,
    UserMenuComponent
  ]
})
export class SharedModule { }
