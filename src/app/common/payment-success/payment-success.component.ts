import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckoutService } from '../../../service/checkout.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private checkoutService: CheckoutService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // Lấy tham số từ URL
      const vnp_TxnRef = params['vnp_TxnRef'];
      const vnp_SecureHash = params['vnp_SecureHash'];
      const vnp_ResponseCode = params['vnp_ResponseCode'];

      if (vnp_TxnRef && vnp_SecureHash && vnp_ResponseCode) {
        // Gọi API backend để kiểm tra kết quả thanh toán
        this.checkoutService.verifyPayment().subscribe(response => {
          if (response.success) {
            // Xử lý đơn hàng thành công
            console.log('Payment successful');
            // Redirect hoặc thông báo cho người dùng
            this.router.navigate(['/order-success']); // Redirect đến trang đơn hàng thành công
          } else {
            // Xử lý trường hợp thanh toán không thành công
            console.error('Payment verification failed', response.message);
            this.router.navigate(['/order-failed']); // Redirect đến trang đơn hàng thất bại
          }
        }, error => {
          console.error('Error verifying payment', error);
          this.router.navigate(['/order-failed']); // Redirect đến trang đơn hàng thất bại
        });
      } else {
        console.error('Missing payment parameters');
        this.router.navigate(['/order-failed']); // Redirect đến trang đơn hàng thất bại
      }
    });
  }


}
