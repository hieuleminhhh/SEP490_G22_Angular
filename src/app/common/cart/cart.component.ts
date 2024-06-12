import { Component, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../../../service/cart.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Dish } from '../../../models/dish.model';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule]
})
export class CartComponent implements OnInit, OnDestroy {

  cartItems: Dish[] = [];
  itemQuantityMap: { [key: string]: number } = {};
  itemCount: number = 0;

  private cartSubscription!: Subscription;
  private itemCountSubscription!: Subscription;

  constructor(private cartService: CartService, private router: Router) { }

  ngOnInit() {
    this.cartSubscription = this.cartService.getCart().subscribe(cartItems => {
      this.cartItems = cartItems;
      this.calculateItemQuantity();
    });

    this.itemCountSubscription = this.cartService.getItemCount().subscribe(count => {
      this.itemCount = count;
    });
  }
  checkout() {
    // Push cart data to session storage
    sessionStorage.setItem('cartItems', JSON.stringify(this.cartItems));
    this.router.navigateByUrl('/checkout');

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

  getItemNames(): string[] {
    return Object.keys(this.itemQuantityMap);
  }

  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
      this.cartService.updateCart(this.cartItems);
    }
  }

  increaseQuantity(item: any) {
    item.quantity++;
    this.cartService.updateCart(this.cartItems);
  }

  removeItem(item: any) {
    if (item.hasOwnProperty('dishId')) {
      this.cartService.removeFromCart(item.dishId, 'Dish');
    } else if (item.hasOwnProperty('comboId')) {
      this.cartService.removeFromCart(item.comboId, 'Combo');
    }
  }

  ngOnDestroy() {
    this.cartSubscription.unsubscribe();
    this.itemCountSubscription.unsubscribe();
  }

}

