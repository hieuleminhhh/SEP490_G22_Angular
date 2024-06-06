import { Component, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../../../service/cart.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Dish } from '../../../models/dish.model';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CheckoutService } from '../../../service/checkout.service';
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

  consigneeName: string = '';
  guestPhone: string = '';
  email:string='';
  address: string = '';
  note: string = '';
  date: string = '';
  time: string = '';
  selectedPaymentMethod: string = 'cash-on-delivery';


  private cartSubscription!: Subscription;
  private itemCountSubscription!: Subscription;

  constructor(private cartService: CartService, private router: Router, private checkoutService: CheckoutService) { }

  ngOnInit() {
    this.cartSubscription = this.cartService.getCart().subscribe(cartItems => {
      this.cartItems = cartItems;
      this.calculateItemQuantity();
    });

    this.itemCountSubscription = this.cartService.getItemCount().subscribe(count => {
      this.itemCount = count;
    });
  }

  calculateItemQuantity() {
    this.itemQuantityMap = {};
    this.cartItems.forEach(item => {
      const itemName = item.itemName;
      this.itemQuantityMap[itemName] = item.quantity;
    });
  }

  getTotalPrice(item: any): number {
    return item.quantity * item.price;
  }

  getTotalCartPrice(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
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



  navigateToPayment(): void {
    const receivingTime = this.formatDateTime(this.date, this.time);
    let pay = '';
    if (this.selectedPaymentMethod === 'banking') {
      pay = 'chờ xác nhận';
    }else{
      pay = 'unpaid';
    }
    const request = {
      guestPhone: this.guestPhone,
      email: this.email,
      addressId: 0,
      guestAddress: this.address,
      consigneeName: this.consigneeName,
      orderDate: new Date().toISOString(),
      status: 'pending',
      paymentStatus: pay,
      recevingOrder: receivingTime,
      totalAmount: 0,
      cartItems: this.cartItems.map(item => ({
        unitPrice: 0,
        quantity: item.quantity,
        note: this.note,
        dishId: item.dishId,
        orderId: 0,
        dishesServed: 0,
        comboId: 0
      }))
    };
      this.checkoutService.submitOrder(request).subscribe({
        next: response => {
          console.log('Order submitted successfully', response);
          this.cartService.clearCart();
          // Chuyển hướng đến trang thanh toán
          this.router.navigate(['/payment'], { queryParams: { phone: this.guestPhone } });
        },
        error: error => {
          console.error('Error submitting order', error);
        }
      });
  }

  formatDateTime(date: string, time: string): string {
    return `${date}T${time}:00.000Z`;
  }
}

