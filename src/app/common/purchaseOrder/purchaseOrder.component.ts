import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {PurchaseOrderService }from '../../../service/purchaseOrder.service';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-purchaseOrder',
  standalone: true,
  templateUrl: './purchaseOrder.component.html',
  styleUrls: ['./purchaseOrder.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule]

})
export class PurchaseOrderComponent implements OnInit {
  phoneNumber: string = '';
  otp: string = '';
  showOtpForm: boolean = false;
  countdown: number = 120;
  phonePattern = /^\d{10}$/;
  interval: any;
  showTabs: boolean = false; // Biến điều kiện để hiển thị các tab
  showPhoneForm: boolean = true;
  successMessages: string[] = []; // Mảng chứa thông báo thành công
  activeTab = 'all';
  data:any;
  orders: Order[] = []; // Thêm biến để lưu dữ liệu đơn hàng
  filteredOrders: Order[] = []; // Mảng để lưu dữ liệu đơn hàng đã lọc

  constructor(private purchaseOrderService: PurchaseOrderService) {}

  handleCorrectOTP() {
    this.showOtpForm = false;
    this.showTabs = true;
    this.showPhoneForm = false;
  }
  showData(tab: string) {
    this.activeTab = tab;
    this.filterOrdersByStatus(tab);
  }

  ngOnInit() {
    this.startCountdown();
  }

  onSubmitPhone() {

    if (!this.phonePattern.test(this.phoneNumber)) {
      alert('Vui lòng nhập số điện thoại hợp lệ.');
      return;
    }
    console.log('Số điện thoại đã gửi:', this.phoneNumber);

    this.resetCountdown();
    this.showOtpForm = true;
  }
  goBackToPhoneNumberForm() {
    this.showOtpForm = false;
  }
  resetCountdown() {
    this.countdown = 120;
    clearInterval(this.interval);
    this.startCountdown();
  }

  closeModal(index: number) {
    // Đóng modal
    this.successMessages.splice(index, 1); // Xóa thông báo thành công đã đọc

  }

  onSubmitOtp() {
    if (this.otp === '555555') {
      this.successMessages.push('Nhập OTP hợp lệ.');
      this.handleCorrectOTP();
      this.purchaseOrderService.getOrders(this.phoneNumber).subscribe(
        (response) => {
          console.log(response);
          this.data = response;
          this.filterOrdersByStatus(this.activeTab);
        },
        (error) => {
          console.error('Lỗi khi lấy dữ liệu đơn hàng:', error);
        }
      );
    } else {
      this.successMessages.push('Vui lòng nhập OTP hợp lệ.');
    }
    setTimeout(() => {
      this.closeModal(this.successMessages.length - 1);
    }, 3000);
    console.log('OTP submitted:', this.otp);
  }


  startCountdown() {
    this.interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.interval);
        this.showOtpForm = false;
      }
    }, 1000);
  }


  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  filterOrdersByStatus(status: string) {
    if (status === 'all') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === status);
    }
  }

}
