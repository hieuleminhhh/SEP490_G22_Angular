import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { PurchaseOrderService } from '../../../service/purchaseOrder.service';
import { NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { Location } from '@angular/common';
import { CookingService } from '../../../service/cooking.service';
import { HttpClient } from '@angular/common/http';
import { PaymentService } from '../../../service/payment.service';
import { ReservationService } from '../../../service/reservation.service';
import { NotificationService } from '../../../service/notification.service';
import { AccountService } from '../../../service/account.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-orderDetail',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, FormsModule, CommonModule, CurrencyFormatPipe],
  templateUrl: './orderDetail.component.html',
  styleUrls: ['./orderDetail.component.css']
})
export class OrderDetailComponent implements OnInit {
  orderId: any;
  accountId: any;
  orderDetail: any;
  deposits: number = 0;
  steps = [
    { title: 'Đơn Hàng Đã Đặt', icon: 'fas fa-clipboard-list', time: '21:28 10-06-2024' },
    this.getPaymentStepInfo(),
    { title: 'Đang chuẩn bị đơn hàng', icon: 'fas fa-box-open', time: '18:01 11-06-2024' },
    { title: 'Đang giao hàng', icon: 'fas fa-shipping-fast', time: '08:28 16-06-2024' },
    { title: 'Đơn Hàng Đã Hoàn Thành', icon: 'fas fa-star', time: '23:59 16-07-2024' }
  ];

  @Input() status: number = 0; // Status của đơn hàng
  cancelationReason: string = 'Không còn nhu cầu';
  orderCancelled: boolean = false;
  cancelBy: string = 'Người mua';
  private socket!: WebSocket;
  private reservationQueue: any[] = [];
  constructor(
    private route: ActivatedRoute,
    private purchaseOrderService: PurchaseOrderService,
    private location: Location, private router: Router, private cookingService: CookingService,
    private paymentService: PaymentService, private http: HttpClient,
    private notificationService: NotificationService, private reservationService: ReservationService,
    private accountService: AccountService, private titleService: Title
  ) { }

  ngOnInit() {
    this.titleService.setTitle('Chi tiết đơn hàng | Eating House');
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    if (this.accountId) {
      this.getAccountDetails(this.accountId);
    } else {
      console.error('Account ID is not available');
    }
    this.orderId = this.route.snapshot.paramMap.get('id');
    console.log(this.orderId);
    this.getOrderDetail();
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
      while (this.reservationQueue.length > 0) {
        this.socket.send(this.reservationQueue.shift());
      }
    };
    this.socket.onmessage = (event) => {
      const reservation = JSON.parse(event.data);
      try {
        this.getOrderDetail();
      } catch (error) {
        console.error('Error parsing reservation data:', error);
      }
    };
    this.socket.onclose = () => {
      console.log('WebSocket connection closed, attempting to reconnect...');
      setTimeout(() => {
        this.initializeWebSocket(); // Hàm khởi tạo WebSocket
      }, 5000); // Thử lại sau 5 giây
    };
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  initializeWebSocket() {
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => { /* xử lý onopen */ };
    this.socket.onmessage = (event) => { /* xử lý onmessage */ };
    this.socket.onclose = () => { /* xử lý onclose */ };
    this.socket.onerror = (error) => { /* xử lý onerror */ };
  }

  isServed:boolean=false;
  getOrderDetail() {
    this.purchaseOrderService.getOrderDetail(this.orderId).subscribe(
      response => {
        this.orderDetail = response;
        response.orderDetails.forEach((orderDetail: { dishesServed: number; }) => {
          if (orderDetail.dishesServed !== 0) {
              this.isServed = true;
          }
      });
        console.log(response);
        this.status = this.orderDetail.status;
        this.deposits = this.orderDetail.deposits || 0;
        const paymentInfo = this.getPaymentStepInfo();
        this.steps[1].title = paymentInfo.title;
        this.steps[1].icon = paymentInfo.icon;
      },
      error => {
        console.error('Error fetching order details:', error);
      }
    );
  }

  goBack() {
    this.location.back();
  }
  getPaymentStepInfo(): { title: string; icon: string } {
    if (this.deposits === 0) {
      if (this.status === 4) {
        return { title: 'Đã xác nhận thanh toán', icon: 'fas fa-check-circle' }; // Icon cho đã xác nhận thanh toán
      } else {
        return { title: 'Thanh toán khi giao hàng', icon: 'fas fa-money-bill' }; // Icon cho thanh toán khi giao hàng
      }
    }
    return { title: 'Đơn Hàng Đã Thanh Toán', icon: 'fas fa-money-check-alt' }; // Mặc định khi deposits > 0
  }


  isCompleted(index: number): boolean {
    switch (this.status) {
      case 1:
        return index === 0;
      case 2:
        if (this.deposits === 0) {
          return index === 0 || index === 2;
        }
        return index <= 2
      case 6:
        if (this.deposits === 0) {
          return index === 0 || index === 2;
        }
        return index <= 2
      case 7:
        if (this.deposits === 0) {
          return index === 0 || index === 2 || index === 3;
        }
        return index <= 3;
      case 4:
        return index <= 4;
      default:
        return false;
    }
  }
  reorder(orderId: number) {
    const order = this.orderDetail.find((orderDetail: { orderId: number; }) => orderDetail.orderId === orderId);

    if (order && Array.isArray(order.orderDetails)) {
      sessionStorage.setItem('reorder', JSON.stringify(order.orderDetails));
      sessionStorage.setItem('isReorder', 'true');
      this.router.navigateByUrl('/cart');
    } else {
      console.error('Order not found or orderDetails is not an array');
    }
  }

  cancelOrder(orderId: number, reserId:number) {

    const url = `https://localhost:7188/api/orders/${orderId}/cancel`;
    this.http.put(url, {}).subscribe(
      response => {
        console.log('Order cancelled:', response);
        this.orderCancelled = true;
        this.updateCancelResion(orderId);
        this.updateStatusReservation(reserId);
        this.createNotification(orderId);
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
          reasonCancel: this.cancelationReason,
          cancelBy: this.cancelBy
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
  createNotification(orderId: number) {
    let description = `Khách hàng đã hủy đơn ${orderId}! Lý do hủy: ${this.cancelationReason}. Vui lòng kiểm tra lại đơn hàng đơn hàng.`;
    const body = {
      description: description,
      orderId: orderId,
      type: 2
    }
    this.makeReservation(description);
    console.log(body);
    this.notificationService.createNotification(body).subscribe(
      response => {
        console.log(response);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  makeReservation(reservationData: any) {
    const message = JSON.stringify(reservationData);
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message); // Gửi yêu cầu đặt bàn khi WebSocket đã mở
    } else if (this.socket.readyState === WebSocket.CONNECTING) {
      this.reservationQueue.push(message);
    } else {
      console.log('WebSocket is not open. Current state:', this.socket.readyState);
    }
  }
  account: any;
  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;
        console.log('Account details:', this.account);
        console.log('Account role:', this.account.role);

      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
}
