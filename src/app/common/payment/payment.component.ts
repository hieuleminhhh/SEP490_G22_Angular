import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CheckoutService } from '../../../service/checkout.service';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../service/payment.service';
import { NotificationService } from '../../../service/notification.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  imports: [CommonModule, CurrencyFormatPipe, RouterModule, FormsModule]
})
export class PaymentComponent implements OnInit {
  request: any;
  data: any;
  orderCancelled: boolean = false;
  guestPhone: string | null = null;
  cancelationReason: string = 'Không còn nhu cầu';
  cancelBy: string = 'Người mua';
  check: boolean = false;
  private socket!: WebSocket;
  private reservationQueue: any[] = [];

  constructor(private route: ActivatedRoute, private paymentService: PaymentService,
    private notificationService: NotificationService, private http: HttpClient, private router: Router, private checkoutService: CheckoutService) { } // Inject Router

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.request = params;
      this.guestPhone = params['guestPhone'];
      this.checkoutSuccess();
    });
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
      console.log('WebSocket connection opened');
      while (this.reservationQueue.length > 0) {
        this.socket.send(this.reservationQueue.shift());
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

  checkoutSuccess(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `https://localhost:7188/api/Cart/checkoutsuccess/${this.guestPhone}`;
      this.http.get(url).subscribe(
        response => {
          this.data = response;
          console.log(this.data);
          if (this.data.status === 5) {
            this.check = true;
          }
          resolve();
        },
        error => {
          console.error('Error during checkout:', error);
          reject(error);
        }
      );
    });
  }

  cancelOrder() {
    if (this.data && this.data.orderId) {
      const orderId = this.data.orderId;
      const url = `https://localhost:7188/api/orders/${orderId}/cancel`;
      this.http.put(url, {}).subscribe(
        response => {
          console.log('Order cancelled:', response);
          this.orderCancelled = true;
          this.updateCancelResion();

          this.createNotification(orderId, this.data.consigneeName);
          window.location.reload();
        },
        error => {
          console.error('Error during order cancellation:', error);
        }
      );
    } else {
      console.error('Order ID not found');
    }
  }

  reorder() {
    console.log(this.data);
    sessionStorage.setItem('reorder', JSON.stringify(this.data.orderDetails));
    sessionStorage.setItem('isReorder', 'true'); // Set reorder flag
    this.router.navigateByUrl('/cart');
  }

  updateCancelResion() {
    const request = {
      cancelationReason: this.cancelationReason,
      cancelBy: this.cancelBy
    };
    console.log(this.data.orderId);

    this.paymentService.updateResionCancle(this.data.orderId, request).subscribe(
      response => {

        console.log(response);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  createNotification(orderId: number, customerName: string) {
    let description = `Khách hàng ${customerName} đã hủy đơn ${orderId}! Lý do hủy: ${this.cancelationReason}. Vui lòng kiểm tra lại đơn hàng đơn hàng.`;
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
}
