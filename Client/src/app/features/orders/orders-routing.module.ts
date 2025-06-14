import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrdersPageComponent } from './orders-page/orders-page.component';

const routes: Routes = [
  {
    path: '',
    component: OrdersPageComponent
  },
  {
    path: 'review',
    loadComponent: () => import('./order-review/order-review.component').then(m => m.OrderReviewComponent)
  },
  {
    path: 'confirmation/:id',
    loadComponent: () => import('./order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent)
  },
  {
    path: 'details/:id',
    loadComponent: () => import('./order-details/order-details.component').then(m => m.OrderDetailsComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }
