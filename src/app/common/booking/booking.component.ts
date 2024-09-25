import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dish } from '../../../models/dish.model';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReservationService } from '../../../service/reservation.service';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { MatDialog } from '@angular/material/dialog';
import { MenuComponent } from '../menu/menu.component';
import { CheckoutService } from '../../../service/checkout.service';
import { NotificationService } from '../../../service/notification.service';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

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
    email: '',
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
  emailGuest: string = '';
  availableTimes: string[] = [];
  formSubmitted = false;
  cartItems: Dish[] = [];
  isValid: boolean = false;
  currentRequest: any;
  message: string = '';
  accountId: number = 0;
  public messages: string[] = [];
  isValidDish: boolean = false;
  maxValue: number = 1000;
  private socket!: WebSocket;
  private reservationQueue: any[] = [];

  constructor(private reservationService: ReservationService, private http: HttpClient,
     private notificationService: NotificationService, private router: Router, public dialog: MatDialog, private checkoutService: CheckoutService
     ,private titleService: Title) {
    const today = new Date();
    this.minDate = this.formatDate(today);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    this.maxDate = this.formatDate(maxDate);
    this.reservation = {
      name: '',
      phone: '',
      email: '',
      date: this.formatDate(today),
      time: '',
      people: 2,
      notes: ''
    };
    this.generateAvailableHours();
  }
  ngAfterViewInit() {
    this.titleService.setTitle('Đặt bàn | Eating House'); 
  }
  ngOnInit(): void {
    this.updateTimes();
    console.log(this.availableHours);
    this.cartSubscription = this.reservationService.getCart().subscribe(cartItems => {
      this.cartItems = cartItems;
      this.calculateItemQuantity();
    });

    const accountIdString = localStorage.getItem('accountId');
    if (accountIdString) {
      this.accountId = JSON.parse(accountIdString);
    }
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
      console.log('WebSocket connection opened');
      while (this.reservationQueue.length > 0) {
        this.socket.send(this.reservationQueue.shift());
      }
    };
    this.socket.onclose = () => {
      console.log('WebSocket connection closed, attempting to reconnect...');
      setTimeout(() => {
        this.initializeWebSocket(); // Hàm khởi tạo WebSocket
      }, 5000); // Thử lại sau 5 giây
    };
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  initializeWebSocket() {
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => { /* xử lý onopen */ };
    this.socket.onmessage = (event) => { /* xử lý onmessage */ };
    this.socket.onclose = () => { /* xử lý onclose */ };
    this.socket.onerror = (error) => { /* xử lý onerror */ };
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.socket) {
      this.socket.close();
    }
  }
  createNotification(guestPhone: string, customerName: string) {
    let description = `Có đơn đặt bàn mới! Vui lòng kiểm tra và xác nhận đơn hàng.`;
    const body = {
      description: description,
      type: 2
    }
    this.makeReservation(description);
    console.log(body);
    this.notificationService.createNotification(body).subscribe(
      response => {
        console.log(response);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
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
  makeReservation(reservationData: any) {
    const message = JSON.stringify(reservationData);
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message); // Gửi yêu cầu đặt bàn khi WebSocket đã mở
    } else if (this.socket.readyState === WebSocket.CONNECTING) {
      this.reservationQueue.push(message);
    } else {
      console.log('WebSocket is not open. Current state:', this.socket.readyState);
    }
  }


  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  updateTimes(): void {
    const now = new Date();
    const selectedDate = new Date(this.reservation.date);
    const isToday = now.toDateString() === selectedDate.toDateString();
    now.setMinutes(now.getMinutes() + 30);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    this.availableTimes = [];

    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (!isToday || (hour > currentHour || (hour === currentHour && minute >= currentMinute))) {
          this.addTimeOption(hour, minute);
        }
      }
    }
  }
  validateInput(item: any, maxValue: number) {
    const value = parseInt(item.quantity, 10);
    if (isNaN(value) || value < 1) {
      item.quantity = 1;
    } else if (value > maxValue) {
      item.quantity = maxValue;
    }
  }

  preventDelete(event: KeyboardEvent, currentQuantity: number) {
    if (currentQuantity <= 1 && (event.key === 'Backspace' || event.key === 'Delete')) {
      event.preventDefault();
    }
    if (currentQuantity >= this.maxValue) {
      if (event.key !== 'Backspace' && event.key !== 'Delete') {
        event.preventDefault();
      }
      return;
    }
    const validKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (validKeys.indexOf(event.key) !== -1 || /^[0-9]$/.test(event.key)) {
      return;
    }
    event.preventDefault();
  }
  addTimeOption(hour: number, minute: number): void {
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    this.availableTimes.push(formattedTime);
  }
  checkTable(reservationTime: string, number: number) {
    this.reservationService.checkValidTable(reservationTime, number).subscribe({
      next: response => {
        this.isValid = response.canReserve;

        if (this.isValid) {
          sessionStorage.setItem('request', JSON.stringify(this.currentRequest));
          sessionStorage.setItem('cart', JSON.stringify(this.cartItems));

          if (this.currentRequest.orderDetails.length > 0) {
            this.router.navigate(['/paymentReservation']);
          } else {
            this.reservationService.createResevetion(this.currentRequest).subscribe({
              next: response => {
                console.log('Order submitted successfully', response);
                this.createNotification(this.currentRequest.guestPhone, this.currentRequest.customerName);
                this.reservationService.clearCart();
                this.router.navigate(['/paymentReservation']);
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
        } else {
          this.message = response.message;
          setTimeout(() => {
            this.message = '';
          }, 3000);
        }
      },
      error: error => {
        console.error('An error occurred:', error.error.message);
        this.message = 'Có lỗi xảy ra khi kiểm tra bàn, vui lòng thử lại.'; // Thông báo lỗi
      }
    });
  }
  submitForm(form: any) {
    this.formSubmitted = true;
    if (form.valid) {
      let dateTime = this.formatDateTime(this.reservation.date, this.reservation.time);

      const request = {
        accountId: this.accountId,
        guestPhone: this.guestPhone,
        email: this.emailGuest,
        guestAddress: '',
        consigneeName: this.consigneeName,
        reservationTime: dateTime,
        guestNumber: this.reservation.people,
        note: this.note,
        orderDate: new Date().toISOString(),
        status: 1,
        recevingOrder: dateTime,
        totalAmount: 0,
        deposits: 0,
        type: 0,
        orderDetails: this.cartItems.map(item => ({
          unitPrice: this.getTotalPrice(item),
          quantity: item.quantity,
          dishId: item.dishId,
          comboId: item.comboId,
          orderTime: new Date().toISOString()
        }))
      };
      this.currentRequest = request;
      const today = new Date();

      if (this.reservation.date === this.formatDate(today)) {
        const data = {
          comboIds: this.cartItems.map(item => item.comboId).filter(id => id !== undefined),
          dishIds: this.cartItems.map(item => item.dishId).filter(id => id !== undefined)
        };
        if (data.comboIds.length > 0 || data.dishIds.length > 0) {
          this.checkoutService.getRemainingItems(data).subscribe(response => {
            this.messages = []; // Đặt lại messages
            for (const combo of response.combos) {
              const itemInCart = this.cartItems.find(item => item.comboId === combo.comboId);
              if (itemInCart && combo.quantityRemaining < itemInCart.quantity) {
                this.messages.push(`Không đủ số lượng món ăn: ${combo.name}. Số lượng yêu cầu: ${itemInCart.quantity}, Số lượng còn lại: ${combo.quantityRemaining}`);
                this.isValidDish = true;
              }
            }
            for (const dish of response.dishes) {
              const itemInCart = this.cartItems.find(item => item.dishId === dish.dishId);
              if (itemInCart && dish.quantityRemaining < itemInCart.quantity) {
                this.messages.push(`Không đủ số lượng món ăn: ${dish.name}. Số lượng yêu cầu: ${itemInCart.quantity}, Số lượng còn lại: ${dish.quantityRemaining}`);
                this.isValidDish = true;
              }
            }

            if (this.messages.length > 0) {
              setTimeout(() => {
                this.messages = [];
              }, 3000);
              return;
            }
            this.checkTable(request.reservationTime, request.guestNumber);
          }, error => {
            console.error('Error during payment initiation', error);
          });
          return;
        }
        else {
          this.checkTable(request.reservationTime, request.guestNumber);
        }
      }
      else {
        this.checkTable(request.reservationTime, request.guestNumber);
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

  }

  closeMenuPopup(): void {
    this.isMenuPopupOpen = false;
  }
}
