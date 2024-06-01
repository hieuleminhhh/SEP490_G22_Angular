import { Component, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../../../service/cart.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Dish } from '../../../models/dish.model';

@Component({
  selector: 'app-cart',
  standalone:true,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  imports: [CommonModule]
})
export class CartComponent implements OnDestroy {
  cartItems: Dish[] = [];
  itemQuantityMap: { [key: string]: number } = {};

  private cartSubscription: Subscription;

  constructor(private cartService: CartService) {
    this.cartSubscription = this.cartService.getCart().subscribe(cartItems => {
      this.cartItems = cartItems;
      this.calculateItemQuantity();
    });
  }

  calculateItemQuantity() {
    this.itemQuantityMap = {};
    this.cartItems.forEach(item => {
      const itemName = item.itemName;
      this.itemQuantityMap[itemName] = item.quantity;
    });
  }

  getTotalPrice(itemName: string): number {
    const item = this.cartItems.find(item => item.itemName === itemName);
    if (item) {
        return item.price * item.quantity;
    } else {
        return 0;
    }
}

  getItemNames(): string[] {
    return Object.keys(this.itemQuantityMap);
  }

  decreaseQuantity(item: Dish) {
    if (item.quantity > 1) {
      item.quantity--;
      this.cartService.updateCart(this.cartItems);
    }
  }

  increaseQuantity(item: Dish) {
    item.quantity++;
    this.cartService.updateCart(this.cartItems);
  }

  removeItem(item: Dish) {
    const index = this.cartItems.findIndex(cartItem => cartItem.dishId === item.dishId);
    if (index !== -1) {
      this.cartItems.splice(index, 1); // Loại bỏ món hàng khỏi mảng cartItems
      this.cartService.updateCart(this.cartItems); // Cập nhật giỏ hàng
    }
  }

  ngOnDestroy() {
    this.cartSubscription.unsubscribe();
  }
}
