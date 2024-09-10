import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../service/reservation.service';
import { Router } from '@angular/router';
import { CheckoutService } from '../../../service/checkout.service';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';

@Component({
  selector: 'app-paymentReservation',
  standalone: true,
  templateUrl: './paymentReservation.component.html',
  styleUrls: ['./paymentReservation.component.css'],
  imports: [CommonModule, FormsModule, CurrencyFormatPipe]
})
export class PaymentReservationComponent implements OnInit {

  data: any;
  cartItem: any;
  ispayment: boolean = false;
  accountId: number=0;
  constructor(private reservationService: ReservationService, private router: Router, private checkoutService: CheckoutService) {

  }

  ngOnInit(): void {
    const request = sessionStorage.getItem('request');
    const cart = sessionStorage.getItem('cart');
    const storedData = sessionStorage.getItem('data');
    const storedCartItem = sessionStorage.getItem('cartItem');
    if (storedData && storedCartItem) {
      this.data = JSON.parse(storedData);
      this.cartItem = JSON.parse(storedCartItem);
      this.ispayment = false;

      // Clear the temporary storage
      sessionStorage.removeItem('data');
      sessionStorage.removeItem('cartItem');
    }
    else if (cart && cart !== '[]' && request) {
      sessionStorage.removeItem('cart');
      sessionStorage.removeItem('request');

      this.cartItem = JSON.parse(cart);
      this.data = JSON.parse(request);
      this.ispayment = true;
    }
    else if (request) {
      sessionStorage.removeItem('request');
      sessionStorage.removeItem('cart');
      this.data = JSON.parse(request);
    }

    const accountIdString = localStorage.getItem('accountId');
    if (accountIdString) {
      this.accountId = JSON.parse(accountIdString);
    }
  }


  getTotalPrice(item: any): number {
    const price = item.discountedPrice != null ? item.discountedPrice : item.price;
    return parseFloat((item.quantity * price).toFixed(2));
  }
  getTotalCartPrice(): number {
    return parseFloat(this.cartItem.reduce((total: number, item: { discountedPrice: null; price: any; quantity: number; }) => {
      const price = item.discountedPrice != null ? item.discountedPrice : item.price;
      return total + (price * item.quantity);
    }, 0).toFixed(2));
  }
  submitForm() {
    const localDateTime = new Date();
    const offset = localDateTime.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = new Date(localDateTime.getTime() - offset).toISOString().slice(0, -1);
    const request = {
      accountId:this.accountId,
      guestPhone: this.data.guestPhone,
      email: '',
      guestAddress: '',
      consigneeName: this.data.consigneeName,
      reservationTime: this.data.reservationTime,
      guestNumber: this.data.guestNumber,
      note: this.data.note,
      orderDate: localISOTime,
      status: 1,
      recevingOrder: this.data.reservationTime,
      totalAmount: this.getTotalCartPrice(),
      deposits: this.getTotalCartPrice() / 2,
      type: 3,
      orderDetails: this.cartItem.map((item: { quantity: any; dishId: any; comboId: any; }) => ({
        unitPrice: this.getTotalPrice(item),
        quantity: item.quantity,
        dishId: item.dishId,
        comboId: item.comboId,
        orderTime: localISOTime
      }))
    };
    console.log("Request Object:", request);
    this.reservationService.createResevetion(request).subscribe({
      next: response => {
        console.log('Order submitted successfully', response);
        this.reservationService.clearCart();
        sessionStorage.setItem('data', JSON.stringify(this.data));
        sessionStorage.setItem('cartItem', JSON.stringify(this.cartItem));

        const requestForVnPay = { ...request, totalAmount: this.getTotalCartPrice() / 2};
        this.checkVnPay(requestForVnPay);
      },
      error: error => {
        if (error.error instanceof ErrorEvent) {
          console.error('An error occurred:', error.error.message);
        } else {
          console.error(`Backend returned code ${error.status}, ` +
            `body was: ${JSON.stringify(error.error)}`);
        }
      }
    });
  }

  checkVnPay(data: any) {
    console.log('Data being sent:', data);
    this.checkoutService.getVnPays(data).subscribe(response => {
      if (response.url) {
        window.location.href = response.url; // Redirect đến URL trả về
      } else {
        console.error('Unexpected response format', response);
      }
    }, error => {
      console.error('Error during payment initiation', error);
      console.error('Error details:', error.error); // Kiểm tra chi tiết lỗi từ server
    });
  }
  goBack() {
    window.history.back();
  }
  goToHome() {
    this.router.navigate(['']);
  }
}
