import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { CheckoutService } from '../../../service/checkout.service';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../service/payment.service';

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

  constructor(private route: ActivatedRoute, private paymentService: PaymentService, private http: HttpClient, private router: Router, private checkoutService: CheckoutService) { } // Inject Router

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.request = params;
      this.guestPhone = params['guestPhone'];
      this.checkoutSuccess();
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
          this.updateCancelResion();
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
    const request ={
      cancelationReason: this.cancelationReason
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



}
