import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../service/reservation.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-paymentReservation',
  standalone:true,
  templateUrl: './paymentReservation.component.html',
  styleUrls: ['./paymentReservation.component.css'],
  imports: [CommonModule, FormsModule]
})
export class PaymentReservationComponent implements OnInit {

  constructor(private reservationService: ReservationService, private router: Router) { }

  data: any;
  cartItem:any;


  ngOnInit() :void{
    const dataString = sessionStorage.getItem('request');
    const cart = sessionStorage.getItem('cart');
    if (dataString) {
      this.data = JSON.parse(dataString);
    }
    if (cart) {
      this.cartItem = JSON.parse(cart);
    }
    console.log(this.data);
    console.log(this.cartItem);

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
}
