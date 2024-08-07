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

@Component({
  selector: 'app-checkout',
  standalone: true,
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, MatDialogModule, CurrencyFormatPipe, PercentagePipe]
})
export class CheckoutComponent implements OnInit {
  selectedService: string = 'service1';
  orderTime: string = 'Sớm nhất';
  isEditing: boolean = false;
  cartItems: Dish[] = [];

  date: string | undefined;
  time: string | undefined;
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

  constructor(private cartService: CartService, private http: HttpClient, private router: Router, private route: ActivatedRoute, private checkoutService: CheckoutService) {
    const today = new Date();
    this.minDate = this.formatDate(today); // Ngày nhận tối thiểu là ngày hiện tại
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    this.maxDate = this.formatDate(maxDate); // Ngày nhận tối đa là ngày hiện tại + 7 ngày
    this.generateAvailableHours();
  }

  ngOnInit() {
    // Lấy dữ liệu từ sessionStorage khi component được khởi tạo
    const cartItemsString = sessionStorage.getItem('cartItems');
    if (cartItemsString) {
      this.cartItems = JSON.parse(cartItemsString); // Chuyển đổi chuỗi JSON thành mảng đối tượng JavaScript
      console.log(this.cartItems);
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
    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  saveTime() {
    if (this.isEarliest) {
      this.orderTime = 'Sớm nhất';
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
      this.date = undefined;
      this.time = undefined;
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
      const currentDate = currentTime.toISOString().split('T')[0];
      const currentTimeStr = currentTime.toTimeString().split(' ')[0].substring(0, 5);
      receivingTime = this.formatDateTime(currentDate, currentTimeStr);
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
      totalAmount: this.getTotalCartPrice(),
      deposits: 0,
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
        console.log(request.totalAmount);
        console.log('Order submitted successfully', response);
        this.cartService.clearCart();
        sessionStorage.removeItem('cartItems');
        if (this.selectedPaymentMethod === 'banking' || this.selectedService==='service2') {
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

        this.discount = response.filter((d: { totalMoney: number; }) => d.totalMoney <= this.getTotalCartPrice());
        this.discountInvalid = response.filter((d: { totalMoney: number; }) => d.totalMoney > this.getTotalCartPrice());
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
