import { ReservationService } from './../../../service/reservation.service';
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
  choiceReser:any;
  cancelBy: string = 'Người mua';
  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router, private cookingService: CookingService, private paymentService: PaymentService,
    private reservationService: ReservationService
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
    this.selectedTab = tab;
    this.filterOrdersByStatus(parseInt(tab));
  }


  filterOrdersByStatus(status: number) {
    if (status === -1) {
      this.filteredOrders = this.orders;
    }
    else if (status === 2) {
      this.filteredOrders = this.orders.filter(order => order.status === 2 || order.status === 6);
    }
    else if (status === 5) {
      this.filteredOrders = this.orders.filter(order => order.status === 5 || order.status === 8);
    }
    else {
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
  cancelOrder() {
console.log(this.choiceOrder);

    const url = `https://localhost:7188/api/orders/${this.choiceOrder}/cancel`;
    this.http.put(url, {}).subscribe(
      response => {
        console.log('Order cancelled:', response);
        this.orderCancelled = true;
        this.updateCancelResion(this.choiceOrder);
        this.updateStatusReservation(this.choiceReser);
        window.location.reload();
      },
      error => {
        console.error('Error during order cancellation:', error);
      }
    );
  }

  updateCancelResion(orderId: number) {
    const request = {
      cancelationReason: this.cancelationReason,
      cancelBy: this.cancelBy
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

  updateStatusReservation(id: number) {
    this.reservationService.updateStatusReservation(id, 5).subscribe(
      response => {
        console.log(response);

        const request = {
          reasonCancel: this.cancelationReason
        };
        this.reservationService.updatereasonCancel(id, request).subscribe(
          response => {
            console.log(response);
          },
          error => {
            console.error('Error:', error);
          }
        );
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

  choiceOrderCancel(orderId: number, reserId:number) {
    this.choiceOrder = orderId;
    this.choiceReser = reserId;
    console.log(this.choiceOrder);

  }
}
