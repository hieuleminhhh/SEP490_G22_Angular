import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dish } from '../../../models/dish.model';
import { CartService } from '../../../service/cart.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReservationService } from '../../../service/reservation.service';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { MatDialog } from '@angular/material/dialog';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-booking',
  standalone: true,
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
  imports: [CommonModule, FormsModule, CurrencyFormatPipe, MenuComponent]
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
  minDate: string;
  maxDate: string;
  availableHours: string[] = [];
  consigneeName: string = '';
  guestPhone: string = '';
  note: string = '';
  availableTimes: string[] = [];
  formSubmitted = false;
  cartItems: Dish[] = [];

  constructor(private reservationService: ReservationService, private router: Router,public dialog: MatDialog) {
    const today = new Date();
    this.minDate = this.formatDate(today);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    this.maxDate = this.formatDate(maxDate);
    this.reservation = {
      name: '',
      phone: '',
      date: this.formatDate(today),
      time: '',
      people: 2,
      notes: ''
    };
    this.generateAvailableHours();
  }


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
  generateAvailableHours() {
    this.availableHours = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
        this.availableHours.push(formattedHour);
      }
    }
  }

  formatDate(date: Date): string {
    // Hàm chuyển đổi định dạng ngày thành chuỗi "YYYY-MM-DD"
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  updateTimes(): void {
    const now = new Date();
    const selectedDate = new Date(this.reservation.date);
    const isToday = now.toDateString() === selectedDate.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    this.availableTimes = [];

    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (isToday && (hour > currentHour || (hour === currentHour && minute >= currentMinute))) {
          this.addTimeOption(hour, minute);
        } else if (!isToday) {
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
      let dateTime = this.formatDateTime(this.reservation.date, this.reservation.time);

      const request = {
        guestPhone: this.guestPhone,
        email: '',
        guestAddress: '',
        consigneeName: this.consigneeName,
        reservationTime: dateTime,
        guestNumber: this.reservation.people,
        note: this.note,
        orderDate: new Date().toISOString(),
        status: 0,
        recevingOrder: dateTime,
        totalAmount: 0,
        deposits: 0,
        type: 0,
        orderDetails: this.cartItems.map(item => ({
          unitPrice: this.getTotalPrice(item),
          quantity: item.quantity,
          dishId: item.dishId,
          comboId: item.comboId
        }))
      };
      console.log(request);
      sessionStorage.setItem('request', JSON.stringify(request));
      sessionStorage.setItem('cart', JSON.stringify(this.cartItems));

      if (request.orderDetails.length > 0) {
        this.router.navigate(['/paymentReservation']);
      } else {
        this.reservationService.createResevetion(request).subscribe({
          next: response => {
            console.log('Order submitted successfully', response);
            this.reservationService.clearCart();
            this.router.navigate(['/paymentReservation']);

          },
          error: error => {
            if (error.error instanceof ErrorEvent) {
              // Lỗi client-side hoặc mạng
              console.error('An error occurred:', error.error.message);
            } else {
              // Lỗi server-side
              console.error(`Backend returned code ${error.status}, ` +
                `body was: ${JSON.stringify(error.error)}`);
            }
          }
        });
      }
    }
  }
  formatDateTime(date: string, time: string): string {
    const datetimeString = `${date}T${time}:00`;
    const dateObj = new Date(datetimeString);

    const localTimezoneOffset = dateObj.getTimezoneOffset();

    const localDateObj = new Date(dateObj.getTime() - localTimezoneOffset * 60000);

    const formattedDateTime = localDateObj.toISOString().slice(0, 19);

    return formattedDateTime;
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

  isMenuPopupOpen = false;

  openMenuPopup(): void {
    this.isMenuPopupOpen = true;
    sessionStorage.setItem('isReser', JSON.stringify('false'));

  }

  closeMenuPopup(): void {
    this.isMenuPopupOpen = false;
  }
}
