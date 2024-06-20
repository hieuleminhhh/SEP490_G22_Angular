import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Dish } from '../models/dish.model';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Address } from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private cartItems: Dish[] = [];
  private cartSubject = new BehaviorSubject<Dish[]>([]);
  private itemCountSubject = new BehaviorSubject<number>(0);
  isReser: boolean = false;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {

  }

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

  // cart.service.ts
private updateCartState() {
  console.log('Updating cart state:', this.cartItems); // Log cart items before update
  this.cartSubject.next([...this.cartItems]);
  const itemCount = this.cartItems.length;
  this.itemCountSubject.next(itemCount);
}



}
