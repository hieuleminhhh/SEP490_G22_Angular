import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment',
  standalone:true,
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  imports:[CommonModule]
})
export class PaymentComponent implements OnInit {
  request: any;
  data:any;
  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.request = params;
      this.checkoutSuccess(params['guestPhone']);
    });
  }

  checkoutSuccess(guestPhone: string) {
    const url = `https://localhost:7188/api/Cart/checkoutsuccess/${guestPhone}`;
    this.http.get(url).subscribe(
      response => {
        this.data = response;
        console.log(this.data);
        console.log('Checkout success:', response);
      },
      error => {
        console.error('Error during checkout:', error);
      }
    );
  }
}
