import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dish } from '../../../models/dish.model';
import { CartService } from '../../../service/cart.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReservationService } from '../../../service/reservation.service';

@Component({
  selector: 'app-booking',
  standalone:true,
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
  imports: [CommonModule, FormsModule]
})
export class BookingComponent implements OnInit {
  reservation = {
    name: '',
    phone: '',
    date: 'today',
    time: '',
    people: 2,
    notes: ''
  };

  itemQuantityMap: { [key: string]: number } = {};

  private cartSubscription!: Subscription;

  constructor(private reservationService: ReservationService, private router: Router) { }
  availableTimes: string[] = [];
  formSubmitted = false;

  cartItems: Dish[] = [];

  ngOnInit(): void {
    this.updateTimes();
    this.cartSubscription = this.reservationService.getCart().subscribe(cartItems => {
      this.cartItems = cartItems;
      this.calculateItemQuantity();
    });
  }
  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  updateTimes(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    this.availableTimes = [];

    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (this.reservation.date === 'today' && (hour > currentHour || (hour === currentHour && minute >= currentMinute))) {
          this.addTimeOption(hour, minute);
        } else if (this.reservation.date !== 'today') {
          this.addTimeOption(hour, minute);
        }
      }
    }
  }

  addTimeOption(hour: number, minute: number): void {
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    this.availableTimes.push(time);
  }

  submitForm(form: any) {
    this.formSubmitted = true;
    if (form.valid) {
      // Handle the form submission.
      console.log('Form is valid, submitting:', this.reservation);
    } else {
      console.log('Form is invalid, please fill in all required fields.');
    }
  }
  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
      this.reservationService.updateCart(this.cartItems);
    }
  }

  increaseQuantity(item: any) {
    item.quantity++;
    this.reservationService.updateCart(this.cartItems);
  }
  calculateItemQuantity() {
    this.itemQuantityMap = {};
    this.cartItems.forEach(item => {
      const itemName = item.itemName;
      this.itemQuantityMap[itemName] = item.quantity;
    });
  }
  getTotalPrice(item: any): number {
    const price = item.discountedPrice != null ? item.discountedPrice : item.price;
    return parseFloat((item.quantity * price).toFixed(2));
  }
  getTotalCartPrice(): number {
    return parseFloat(this.cartItems.reduce((total, item) => {
      const price = item.discountedPrice != null ? item.discountedPrice : item.price;
      return total + (price * item.quantity);
    }, 0).toFixed(2));
  }
  removeItem(item: any) {
    if (item.hasOwnProperty('dishId')) {
      this.reservationService.removeFromCart(item.dishId, 'Dish');
    } else if (item.hasOwnProperty('comboId')) {
      this.reservationService.removeFromCart(item.comboId, 'Combo');
    }
  }
  navigateToMenu() {
    sessionStorage.setItem('isReser', JSON.stringify(true));
    this.router.navigate(['/menu']);
  }
}
