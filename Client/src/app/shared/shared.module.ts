import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { ImageGuideComponent } from './components/image-guide/image-guide.component';

@NgModule({
  declarations: [
    ProductCardComponent,
    ImageGuideComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ProductCardComponent,
    ImageGuideComponent
  ]
})
export class SharedModule { }
