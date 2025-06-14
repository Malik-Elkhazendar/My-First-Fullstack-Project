import { Component } from '@angular/core';
import { OrdersListComponent } from '../orders-list/orders-list.component';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [OrdersListComponent],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss'
})
export class OrdersPageComponent {

}
