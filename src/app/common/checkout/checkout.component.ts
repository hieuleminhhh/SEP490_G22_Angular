import { Component, OnInit } from '@angular/core';
import { Dish } from '../../../models/dish.model';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone:true,
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  imports: [CommonModule, RouterLink, RouterLinkActive]
})
export class CheckoutComponent implements OnInit {

  cartItems: Dish[] = [];

  constructor() { }

  ngOnInit() {
    // Lấy dữ liệu từ sessionStorage khi component được khởi tạo
    const cartItemsString = sessionStorage.getItem('cartItems');
    if (cartItemsString) {
      this.cartItems = JSON.parse(cartItemsString); // Chuyển đổi chuỗi JSON thành mảng đối tượng JavaScript
      console.log(this.cartItems);
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
}
