import { Component, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../../../service/cart.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Dish } from '../../../models/dish.model';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, CurrencyFormatPipe]
})
export class CartComponent implements OnInit, OnDestroy {

  cartItems: Dish[] = [];
  itemQuantityMap: { [key: string]: number } = {};
  itemCount: number = 0;
  maxValue: number = 1000;

  private cartSubscription!: Subscription;
  private itemCountSubscription!: Subscription;

  constructor(private cartService: CartService, private router: Router, private titleService: Title) { }

  ngOnInit() {
    this.titleService.setTitle('Giỏ hàng | Eating House');
    const isReorder = sessionStorage.getItem('isReorder');

    if (isReorder) {
      // Xóa cờ reorder
      sessionStorage.removeItem('isReorder');

      const storedCartItems = sessionStorage.getItem('reorder');
      console.log(storedCartItems);
      if (storedCartItems) {
        this.cartItems = JSON.parse(storedCartItems);
        this.calculateItemQuantity();

        this.itemCount = this.cartItems.length;
        this.cartService.updateCart(this.cartItems); // Cập nhật giỏ hàng trong service
      }
    }
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


  removeItem(item: any) {
    if (item.hasOwnProperty('dishId')) {
      this.cartService.removeFromCart(item.dishId, 'Dish');
    } else if (item.hasOwnProperty('comboId')) {
      this.cartService.removeFromCart(item.comboId, 'Combo');
    }
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.itemCountSubscription) {
      this.itemCountSubscription.unsubscribe();
    }
  }

}

