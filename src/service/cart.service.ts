import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Dish } from '../models/dish.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: Dish[] = [];
  private cartSubject = new BehaviorSubject<any[]>([]);
  private itemCountSubject = new BehaviorSubject<number>(0);

  constructor() { }

  addToCart(item: Dish) {
    const existingItem = this.cartItems.find(cartItem => cartItem.dishId === item.dishId);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      item.quantity = 1;
      this.cartItems.push(item);
    }
    this.cartSubject.next([...this.cartItems]);
    this.itemCountSubject.next(this.cartItems.length);
  }


  getCart() {
    return this.cartSubject.asObservable();
  }

  getItemCount(): Observable<number> {
    return this.itemCountSubject.asObservable();
  }

  updateCart(cartItems: Dish[]) {
    this.cartSubject.next([...cartItems]);
    this.itemCountSubject.next(cartItems.reduce((total, item) => total + item.quantity, 0));
  }
}
