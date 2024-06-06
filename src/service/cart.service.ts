import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Dish } from '../models/dish.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: Dish[] = [];
  private cartSubject = new BehaviorSubject<Dish[]>([]);
  private itemCountSubject = new BehaviorSubject<number>(0);

  constructor() { }

  addToCart(item: any, itemType: string) {
    const existingItem = itemType === 'Dish' ? this.cartItems.find
    (cartItem => cartItem.dishId === item.dishId) : this.cartItems.find
    (cartItem => cartItem.comboId === item.comboId);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      item.quantity = 1;
      this.cartItems.push(item);
    }

    this.updateCartState();
  }

  getCart(): Observable<Dish[]> {
    return this.cartSubject.asObservable();
  }

  getItemCount(): Observable<number> {
    return this.itemCountSubject.asObservable();
  }

  updateCart(cartItems: any[]) {
    this.cartItems = cartItems;
    this.updateCartState();
  }

  removeFromCart(itemId: number, itemType: string) {
    if (itemType === 'Dish') {
      this.cartItems = this.cartItems.filter(item => item.dishId !== itemId);
    } else if (itemType === 'Combo') {
      this.cartItems = this.cartItems.filter(item => item.comboId !== itemId);
    }

    this.updateCartState();
  }

  clearCart() {
    this.cartItems = [];
    this.updateCartState();
  }

  private updateCartState() {
    this.cartSubject.next([...this.cartItems]);
    const itemCount = this.cartItems.length;  // Đếm số loại item
    this.itemCountSubject.next(itemCount);
  }

}
