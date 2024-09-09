import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PurchaseOrderService } from '../../../service/purchaseOrder.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';

@Component({
  selector: 'app-purchaseOrder',
  standalone: true,
  templateUrl: './purchaseOrder.component.html',
  styleUrls: ['./purchaseOrder.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule, CurrencyFormatPipe]
})
export class PurchaseOrderComponent implements OnInit {
  interval: any;
  showTabs: boolean = true;
  selectedTab: string = '-1';
  orders: any;
  filteredOrders: any;
  subscriptions: Subscription[] = [];
  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {

  }
  showData(tab: string) {
    this.selectedTab = tab;
    this.filterOrdersByStatus(parseInt(tab)); // Convert tab to number
  }


  closeModal(index: number) {

  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  filterOrdersByStatus(status: number) {
    if (status === -1) {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter((order: { status: number; }) => order.status === status);
    }
    console.log(this.filteredOrders);
  }

  goToOrderDetail(orderId: string) {
    // Chuyển hướng đến trang chi tiết đơn hàng với orderId được truyền vào
    this.router.navigate(['/orderDetail', orderId]);
  }

  reorder(orderId: number) {
    console.log(this.orders);
    if (Array.isArray(this.orders)) {
      console.log('Orders is an array', this.orders);
      const order = this.orders.find(order => order.orderId === orderId);

      if (order && Array.isArray(order.orderDetails)) {
        console.log('Order found', order);
        const orderDetails = order.orderDetails;
        sessionStorage.setItem('reorder', JSON.stringify(orderDetails));
        sessionStorage.setItem('isReorder', 'true'); // Set reorder flag
        this.router.navigateByUrl('/cart');
      } else {
        console.error('Order not found or orderDetails is not an array');
      }
    } else {
      console.error('Orders is not an array or undefined');
    }
  }





}
