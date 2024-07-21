import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CheckoutService } from '../../../service/checkout.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  imports: [CommonModule]
})
export class PaymentComponent implements OnInit {
  request: any;
  data: any;
  orderCancelled: boolean = false;
  guestPhone: string | null = null;
  selectedPaymentMethod: string | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router, private checkoutService: CheckoutService) { } // Inject Router

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.request = params;
      this.guestPhone = params['guestPhone'];
      this.selectedPaymentMethod = params['paymentmethod'];
      console.log(this.selectedPaymentMethod);
      this.checkoutSuccess().then(() => {
        if (this.selectedPaymentMethod === 'banking') {
          this.checkVnPay();
        }
      });
    });
  }

  checkVnPay() {
    this.checkoutService.getVnPay(this.data).subscribe(response => {
      if (response.url) {
        window.location.href = response.url; // Redirect đến URL trả về
      } else {
        console.error('Unexpected response format', response);
      }
    }, error => {
      console.error('Error during payment initiation', error);
    });
  }

  checkoutSuccess(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `https://localhost:7188/api/Cart/checkoutsuccess/${this.guestPhone}`;
      this.http.get(url).subscribe(
        response => {
          this.data = response;
          console.log(this.data);
          console.log('Checkout success:', response);
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

}
