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
export class PurchaseOrderComponent implements OnInit, OnDestroy {
  phoneNumber: string = '';
  otp: string = '';
  showOtpForm: boolean = false;
  countdown: number = 120;
  phonePattern = /^\d{10}$/;
  interval: any;
  showTabs: boolean = false;
  selectedTab: string = '-1';
  showPhoneForm: boolean = true;
  successMessages: string[] = [];
  message: string = '';
  orders: any;
  otpMessage: string = '';
  filteredOrders: any;
  subscriptions: Subscription[] = [];
  OTP: string = '040902';
  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearInterval(this.interval);
  }

  handleCorrectOTP() {
    this.showOtpForm = false;
    this.showTabs = true;
    this.showPhoneForm = false;
  }

  showData(tab: string) {
    this.selectedTab = tab;
    this.filterOrdersByStatus(parseInt(tab)); // Convert tab to number
  }

  onSubmitPhone() {
    this.message = ''; // Reset thông điệp trước khi kiểm tra
    if (!this.phonePattern.test(this.phoneNumber)) {
      this.message = 'Vui lòng nhập số điện thoại hợp lệ.';
      return;
    }
    const sub = this.purchaseOrderService.checkPhone(this.phoneNumber).subscribe(
      exists => {
        if (exists) {
          console.log('Checkout success. Phone exists:', exists);
          console.log('Số điện thoại đã gửi:', this.phoneNumber);
          this.resetCountdown();
          this.showOtpForm = true;
          this.sendSms();
        } else {
          console.error('Error during checkout: Phone does not exist');
          this.message = 'Không có dữ liệu của đơn hàng. Vui lòng kiểm tra lại số điện thoại.';
        }
      },
      error => {
        console.error('Error during checkout:', error);
        this.message = 'Không có dữ liệu của đơn hàng. Vui lòng kiểm tra lại số điện thoại.';
      }
    );
    this.subscriptions.push(sub);
  }
  sendSms() {
    this.purchaseOrderService.sendSms().subscribe(
      response => {
        console.log('SMS sent successfully:', response);

        // Trích xuất OTP từ body
        const messageBody = response.body; // Lấy nội dung tin nhắn
        const otpMatch = messageBody.match(/(\d{6})/); // Tìm số 6 chữ số trong body

        if (otpMatch) {
          this.OTP = otpMatch[0];
        } else {
          console.error('OTP not found in the message body.');
        }
      },
      error => {
        console.error('Error sending SMS:', error);
      }
    );
  }

  goBackToPhoneNumberForm() {
    this.showOtpForm = false;
  }

  resetCountdown() {
    this.countdown = 120;
    clearInterval(this.interval);
    this.startCountdown();
  }

  closeModal(index: number) {
    this.successMessages.splice(index, 1);
  }

  onSubmitOtp() {
    this.otpMessage = ''; // Reset thông điệp trước khi kiểm tra
    if (this.otp === this.OTP) {
      this.otpMessage = 'Nhập OTP hợp lệ.';
      this.handleCorrectOTP();
      const sub = this.purchaseOrderService.getOrders(this.phoneNumber).subscribe(
        response => {
          console.log(response);
          this.orders = response;
          this.filterOrdersByStatus(parseInt(this.selectedTab));
        },
        error => {
          console.error('Lỗi khi lấy dữ liệu đơn hàng:', error);
          this.otpMessage = 'Lỗi khi lấy dữ liệu đơn hàng. Vui lòng thử lại.';
        }
      );
      this.subscriptions.push(sub);
    } else {
      this.otpMessage = 'Vui lòng nhập OTP hợp lệ.';
    }

    // Đặt timeout để xóa thông điệp sau 3 giây
    setTimeout(() => {
      this.otpMessage = ''; // Reset thông điệp sau 3 giây
    }, 3000);

    console.log('OTP submitted:', this.otp);
  }

  startCountdown() {
    this.interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.interval);
        this.showOtpForm = false;
      }
    }, 1000);
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
