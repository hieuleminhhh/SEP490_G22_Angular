import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Dish } from '../../../models/dish.model';
import { CommonModule, Time } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CheckoutService } from '../../../service/checkout.service';
import { CartService } from '../../../service/cart.service';
import { HttpClient } from '@angular/common/http';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { PercentagePipe } from '../material/percentFormat/percentFormat.component';
import { ReservationService } from '../../../service/reservation.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, MatDialogModule, CurrencyFormatPipe, PercentagePipe]
})
export class CheckoutComponent implements OnInit {
  selectedService: string = 'service1';
  orderTime: string = 'Giao hàng sớm nhất';
  reserTime: string = ' ';
  isEditing: boolean = false;
  cartItems: Dish[] = [];

  date: string = '';
  time: string = '';
  isEarliest: boolean = true;

  consigneeName: string = '';
  guestPhone: string = '';
  email: string = '';
  address: string = '';
  note: string = '';
  people: number | undefined;
  selectedPaymentMethod: string = 'delivery';
  minDate: string; // Ngày nhận tối thiểu là ngày hiện tại
  maxDate: string; // Ngày nhận tối đa là ngày hiện tại + 7 ngày
  availableHours: string[] = [];

  discount: any;
  discountInvalid: any
  selectedDiscount: number | null = null;
  selectedDiscountDetails: any = null;
  selectedPromotion: boolean = false;

  constructor(private cartService: CartService, private reservationService: ReservationService, private http: HttpClient, private router: Router, private route: ActivatedRoute, private checkoutService: CheckoutService) {
    const today = new Date();
    this.date = this.formatDate(today);
    this.minDate = this.formatDate(today);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    this.maxDate = this.formatDate(maxDate);
    this.generateAvailableHours();
    console.log(today);
    console.log(this.date);


  }

  ngOnInit() {
    // Lấy dữ liệu từ sessionStorage khi component được khởi tạo
    const cartItemsString = sessionStorage.getItem('cartItems');
    if (cartItemsString) {
      this.cartItems = JSON.parse(cartItemsString); // Chuyển đổi chuỗi JSON thành mảng đối tượng JavaScript
      console.log(this.cartItems);
    }
    this.updateTimes();
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

  formatDate(date: any): string {
    // Hàm chuyển đổi định dạng ngày thành chuỗi "YYYY-MM-DD"
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  updateTimes(): void {
    const now = new Date();
    const selectedDate = new Date(this.date);
    const isToday = now.toDateString() === selectedDate.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    this.availableHours = [];

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
    this.availableHours.push(time);
  }

  toggleEdit() {
    // Hiển thị modal khi nhấn vào nút "Thay đổi"
    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  hideModal() {
    // Đóng modal
    if (!this.date || !this.time) {
      this.isEarliest = true;
    }

    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  saveTime() {
    console.log(this.date, this.time);

    if (this.isEarliest) {
      this.orderTime = 'Giao hàng sớm nhất';
    } else {
      // Xử lý khi người dùng nhập ngày và giờ
      if (this.date && this.time) {
        this.orderTime = 'Ngày:' + this.date + '  Giờ:' + this.time;
      } else {
        console.error('Ngày hoặc giờ chưa được nhập.');
        // Có thể thực hiện các xử lý khác tại đây, ví dụ hiển thị thông báo lỗi
      }
    }

    console.log('Đã lưu thời gian:', this.orderTime);
    this.hideModal(); // Đóng modal sau khi lưu thành công
  }

  formatDateTime(date: string, time: string): string {
    return `${date}T${time}:00.000Z`;
  }
  onModalShown() {
    // Xử lý khi modal được hiển thị
  }

  onModalHidden() {
    // Xử lý khi modal bị ẩn đi
  }
  onEarliestChange() {
    if (this.isEarliest) {
      this.date = new Date().toISOString().split('T')[0];
      this.time = '';
    }
  }

  getTotalPrice(item: any): number {
    const price = item.discountedPrice != null ? item.discountedPrice : item.price;
    return parseFloat((item.quantity * price).toFixed(2));
  }

  getTotalCartPrice(): number {
    const totalAmount = this.cartItems.reduce((total, item) => {
      const price = item.discountedPrice != null ? item.discountedPrice : item.price;
      return total + (price * item.quantity);
    }, 0);

    if (this.selectedDiscountDetails) {
      const discount = totalAmount * this.selectedDiscountDetails.discountPercent / 100;
      return parseFloat((totalAmount - discount).toFixed(2));
    }

    return parseFloat(totalAmount.toFixed(2));
  }

  getDiscountAmount(): number {
    if (this.selectedDiscountDetails) {
      const totalAmount = this.cartItems.reduce((total, item) => {
        const price = item.discountedPrice != null ? item.discountedPrice : item.price;
        return total + (price * item.quantity);
      }, 0);
      const discount = totalAmount * this.selectedDiscountDetails.discountPercent / 100;
      return parseFloat(discount.toFixed(2));
    }
    return 0;
  }
  onPaymentMethodChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.selectedPaymentMethod = inputElement.value;
  }

  submitForm(): void {
    let receivingTime: string = '';
    if (this.date && this.time) {
      receivingTime = this.formatDateTime(this.date, this.time);
    } else {
      const currentTime = new Date();
      currentTime.setHours(currentTime.getHours() + 1);
      const year = currentTime.getFullYear();
      const month = String(currentTime.getMonth() + 1).padStart(2, '0'); // Lưu ý tháng bắt đầu từ 0 nên cần cộng thêm 1
      const day = String(currentTime.getDate()).padStart(2, '0');

      // Định dạng ngày theo 'YYYY-MM-DD'
      const currentDate = `${year}-${month}-${day}`;
      const currentTimeStr = currentTime.toTimeString().split(' ')[0].substring(0, 5);
      console.log(currentDate);
      console.log(currentTime);
      receivingTime = this.formatDateTime(currentDate, currentTimeStr);
    }
    let deposits = 0;
    if (this.selectedService === 'service1') {
      if (this.selectedPaymentMethod === 'banking') {
        deposits = this.getTotalCartPrice();
      }
      const request = {
        guestPhone: this.guestPhone,
        email: this.email,
        addressId: 0,
        guestAddress: this.address,
        consigneeName: this.consigneeName,
        orderDate: new Date().toISOString(),
        status: 1,
        recevingOrder: receivingTime,
        deposits: deposits,
        note: this.note,
        type: 2,
        discountId: this.selectedDiscount,
        orderDetails: this.cartItems.map(item => ({
          unitPrice: this.getTotalPrice(item),
          quantity: item.quantity,
          dishId: item.dishId,
          comboId: item.comboId,
          orderTime: new Date().toISOString()
        }))
      };
      console.log(request);
      this.checkoutService.submitOrder(request).subscribe({
        next: response => {
          console.log(request);
          console.log('Order submitted successfully', response);
          this.cartService.clearCart();
          sessionStorage.removeItem('cartItems');
          if (this.selectedPaymentMethod === 'banking' || this.selectedService === 'service2') {
            this.checkVnPay(this.guestPhone);
          } else {
            this.router.navigate(['/payment'], { queryParams: { guestPhone: this.guestPhone } });
          }

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

    if (this.selectedService === 'service2') {
      const request = {
        guestPhone: this.guestPhone,
        email: '',
        guestAddress: '',
        consigneeName: this.consigneeName,
        reservationTime: receivingTime,
        guestNumber: this.people,
        note: this.note,
        orderDate: new Date().toISOString(),
        status: 1,
        recevingOrder: receivingTime,
        totalAmount: this.getTotalCartPrice(),
        deposits: this.getTotalCartPrice() / 2,
        type: 3,
        orderDetails: this.cartItems.map(item => ({
          unitPrice: this.getTotalPrice(item),
          quantity: item.quantity,
          dishId: item.dishId,
          comboId: item.comboId,
          orderTime: new Date().toISOString()
        }))
      };
      console.log("Request Object:", request);
      this.reservationService.createResevetion(request).subscribe({
        next: response => {
          console.log('Order submitted successfully', response);
          this.reservationService.clearCart();
          this.cartService.clearCart();
          sessionStorage.setItem('request', JSON.stringify(request));
          sessionStorage.setItem('cart', JSON.stringify(this.cartItems));

          const requestForVnPay = { ...request, totalAmount: this.getTotalCartPrice() / 2 };
          this.checkVnPayReser(requestForVnPay);
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
  }

  checkVnPay(guestPhone: string) {
    sessionStorage.setItem('guestPhone', guestPhone);
    const url = `https://localhost:7188/api/Cart/checkoutsuccess/${guestPhone}`;
    this.http.get(url).subscribe(
      response => {
        this.checkoutService.getVnPay(response).subscribe(response => {
          if (response.url) {
            window.location.href = response.url; // Redirect đến URL trả về
          } else {
            console.error('Unexpected response format', response);
          }
        }, error => {
          console.error('Error during payment initiation', error);
        });
      }
    )
  }
  checkVnPayReser(data: any) {
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
  openDiscountModal(): void {
    this.getListDiscount();
    const discountModal = document.getElementById('discountModal');
    if (discountModal) {
      discountModal.classList.add('show');
      discountModal.style.display = 'block';
    }
    this.selectedPromotion = true;
  }
  closeDishModal(): void {
    const discountModal = document.getElementById('discountModal');
    if (discountModal) {
      discountModal.classList.remove('show');
      discountModal.style.display = 'none';
    }
  }

  getListDiscount(): void {
    this.checkoutService.getListDiscount().subscribe(
      response => {
        console.log(response);

        const today = new Date(); // Ngày hiện tại

        // Lọc những discount hợp lệ
        this.discount = response.filter((d: {
          totalMoney: number;
          startTime: string;
          endTime: string;
          discountStatus: boolean; // Bổ sung điều kiện status
        }) => {
          const startDate = new Date(d.startTime);
          const endDate = new Date(d.endTime);
          return d.discountStatus === true && d.totalMoney <= this.getTotalCartPrice() && today >= startDate && today <= endDate;
        });
        console.log(today);
        console.log(this.discount);

        // Lọc những discount không hợp lệ
        this.discountInvalid = response.filter((d: {
          totalMoney: number;
          startTime: string;
          endTime: string;
          discountStatus: boolean; // Bổ sung điều kiện status
        }) => {
          const startDate = new Date(d.startTime);
          const endDate = new Date(d.endTime);
          return d.discountStatus !== true || d.totalMoney > this.getTotalCartPrice() || today < startDate || today > endDate;
        });
      },
      error => {
        console.error('Error:', error);
      }
    );
  }


  saveDiscount() {
    if (this.selectedDiscount !== null) {
      this.selectedDiscountDetails = this.discount.find((d: { discountId: number | null; }) => d.discountId === this.selectedDiscount);
    } else {
      this.selectedDiscountDetails = null;
    }
    console.log(this.selectedDiscountDetails);
    this.closeDishModal();
  }

  onDiscountSelect(discountId: number) {
    if (this.selectedDiscount === discountId) {
      this.selectedDiscount = null; // Bỏ chọn nếu đã được chọn trước đó
    } else {
      this.selectedDiscount = discountId; // Chọn mã giảm giá mới
    }
  }
}
