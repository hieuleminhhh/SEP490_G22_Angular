import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Dish } from '../../../models/dish.model';
import { CommonModule, Time } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CheckoutService } from '../../../service/checkout.service';
import { CartService } from '../../../service/cart.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule,MatDialogModule]
})
export class CheckoutComponent implements OnInit {
  selectedService: string = 'service1';
  orderTime: string = 'Sớm nhất';
  isEditing: boolean = false;
  selectedTime!: Date;
  cartItems: Dish[] = [];

  date: string | undefined;
  time: string | undefined;
  isEarliest: boolean = false;

  consigneeName: string = '';
  guestPhone: string = '';
  email: string = '';
  address: string = '';
  note: string = '';
  people:number | undefined;
  selectedPaymentMethod: string = 'delivery';

  constructor(private cartService: CartService,private router: Router,private route: ActivatedRoute,private checkoutService: CheckoutService) { }

  ngOnInit() {
    // Lấy dữ liệu từ sessionStorage khi component được khởi tạo
    const cartItemsString = sessionStorage.getItem('cartItems');
    if (cartItemsString) {
      this.cartItems = JSON.parse(cartItemsString); // Chuyển đổi chuỗi JSON thành mảng đối tượng JavaScript
      console.log(this.cartItems);
    }
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
        this.orderTime = 'Ngày:'+this.date +'  Giờ:'+ this.time;
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
    return parseFloat(this.cartItems.reduce((total, item) => {
      const price = item.discountedPrice != null ? item.discountedPrice : item.price;
      return total + (price * item.quantity);
    }, 0).toFixed(2));
  }

  navigateToPayment(): void {
    let receivingTime:string='';
    if (this.date && this.time) {
      receivingTime = this.formatDateTime(this.date, this.time);
    }else{
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
      status: 0,
      recevingOrder: receivingTime,
      totalAmount: 0,
      deposits: 0,
      cartItems: this.cartItems.map(item => ({
        unitPrice: this.getTotalPrice(item),
        quantity: item.quantity,
        note: this.note,
        dishId: item.dishId,
        orderId: 0,
        dishesServed: 0,
        comboId: item.comboId
      }))
    };
    console.log(request);
    this.checkoutService.submitOrder(request).subscribe({
      next: response => {
        console.log('Order submitted successfully', response);
        this.cartService.clearCart();
        sessionStorage.removeItem('cartItems');
        if (this.selectedPaymentMethod === 'banking') {
          // Chuyển hướng đến trang quét mã nếu chọn "Paying through bank"
          this.router.navigate(['/payment-scan'], { queryParams: { guestPhone: this.guestPhone } });
        } else {
          // Chuyển hướng đến trang thanh toán thông thường
          this.router.navigate(['/payment'], { queryParams: { guestPhone: this.guestPhone } });
        }
      },
      error: error => {
        console.error('Error submitting order', error);
      }
    });
  }


}
