import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PurchaseOrderService } from '../../../service/purchaseOrder.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { CookingService } from '../../../service/cooking.service';
import { PaymentService } from '../../../service/payment.service';

@Component({
  selector: 'app-purchaseOrder',
  standalone: true,
  templateUrl: './purchaseOrder.component.html',
  styleUrls: ['./purchaseOrder.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule, CurrencyFormatPipe]
})
export class PurchaseOrderComponent implements OnInit, OnDestroy {
  interval: any;
  showTabs: boolean = true;
  selectedTab: string = '-1';
  orders: any[] = []; // Khai báo orders như một mảng
  filteredOrders: any[] = []; // Khai báo filteredOrders như một mảng
  subscriptions: Subscription[] = [];
  accountId: number | null = null; // Khai báo accountId là null
  cancelationReason: string = 'Không còn nhu cầu';
  orderCancelled: boolean = false;
  choiceOrder: any;
  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router, private cookingService: CookingService, private paymentService: PaymentService
  ) { }

  ngOnInit() {
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;

    // Kiểm tra xem accountId có hợp lệ không
    if (this.accountId !== null) {
      this.getOrdersPurchase(this.accountId);
    } else {
      console.error('Account ID is not valid');
    }
  }
  showData(tab: string) {
    if (tab === '6') {
      tab = '2';  // Chuyển '6' về '2' để xử lý logic tương tự
    }
    this.selectedTab = tab;
    this.filterOrdersByStatus(parseInt(tab));
  }


  filterOrdersByStatus(status: number) {
    if (status === -1) {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === status);
    }
    console.log(status);

    console.log(this.filteredOrders);
  }

  goToOrderDetail(orderId: string) {
    this.router.navigate(['/orderDetail', orderId]);
  }

  reorder(orderId: number) {
    const order = this.orders.find(order => order.orderId === orderId);

    if (order && Array.isArray(order.orderDetails)) {
      sessionStorage.setItem('reorder', JSON.stringify(order.orderDetails));
      sessionStorage.setItem('isReorder', 'true');
      this.router.navigateByUrl('/cart');
    } else {
      console.error('Order not found or orderDetails is not an array');
    }
  }
  cancelOrder(orderId: number) {

    const url = `https://localhost:7188/api/orders/${orderId}/cancel`;
    this.http.put(url, {}).subscribe(
      response => {
        console.log('Order cancelled:', response);
        this.orderCancelled = true;
        this.updateCancelResion(orderId);
        window.location.reload();
      },
      error => {
        console.error('Error during order cancellation:', error);
      }
    );
  }

  updateCancelResion(orderId: number) {
    const request = {
      cancelationReason: this.cancelationReason
    };

    this.paymentService.updateResionCancle(orderId, request).subscribe(
      response => {
        console.log(response);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  getOrdersPurchase(accountId: number): void {
    this.purchaseOrderService.getOrdersPurchase(accountId).subscribe(
      response => {
        this.orders = response.orders; // Giả sử response chứa orders
        this.filteredOrders = this.orders; // Khởi tạo filteredOrders với tất cả các đơn hàng
        console.log(this.orders);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }

  ngOnDestroy() {
    // Hủy tất cả subscriptions để tránh rò rỉ bộ nhớ
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  choiceOrderCancel(orderId: number) {
    this.choiceOrder = orderId;
  }
}
