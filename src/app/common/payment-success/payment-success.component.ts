import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CheckoutService } from '../../../service/checkout.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css'],
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule]
})
export class PaymentSuccessComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private checkoutService: CheckoutService,
    private router: Router,
    private http: HttpClient
  ) { }

  success: boolean = true;
  guestPhone:string ='';

  ngOnInit() {
    this.guestPhone = sessionStorage.getItem('guestPhone') || '';
    sessionStorage.removeItem('guestPhone');
    this.route.queryParams.subscribe(params => {
      const responseCode = params['vnp_ResponseCode'];
      const orderInfo = params['vnp_OrderInfo'];
      console.log(params);

      if (responseCode === '00') {
        // Thanh toán thành công
        this.success = true;
        console.log('Thanh toán thành công:', params);
      } else {
        // Thanh toán thất bại
        this.success = false;
        const orderId = this.extractOrderId(orderInfo);
        this.cancelOrder(orderId);
        console.log('Thanh toán thất bại:', params);
      }
    });
  }

  extractOrderId(orderInfo: string): number | null {
    const match = orderInfo.match(/\d+$/);
    return match ? Number(match[0]) : null;
  }

  cancelOrder(orderId: number|null) {
    const url = `https://localhost:7188/api/orders/${orderId}/cancel`;
    this.http.put(url, {}).subscribe(
      response => {
        console.log('Order cancelled:', response);
      },
      error => {
        console.error('Error during order cancellation:', error);
      }
    );
  }
  viewOrder(){
    console.log(this.guestPhone);
    if(this.guestPhone){
      this.router.navigate(['/payment'], { queryParams: { guestPhone: this.guestPhone} });
    }
    else{
      this.router.navigate(['/paymentReservation']);
    }
  }
}
