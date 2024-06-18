import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Dish } from '../models/dish.model';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Address } from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: Dish[] = [];
  private cartSubject = new BehaviorSubject<Dish[]>([]);
  private itemCountSubject = new BehaviorSubject<number>(0);
  private guestInfo = new BehaviorSubject<Address | null>(null);

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {
    // Initialize cart from session storage if available
    const storedCartItems = sessionStorage.getItem('reorder');
    if (storedCartItems) {
      this.cartItems = JSON.parse(storedCartItems);
      this.updateCartState();
    }
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

  getItemCount(): Observable<number> {
    return this.itemCountSubject.asObservable();
  }
  updateItemCount(count: number): void {
    this.itemCountSubject.next(count);
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

  // Save cart to session storage
  sessionStorage.setItem('reorder', JSON.stringify(this.cartItems));
}


  setGuestInfo(info: Address) {
    this.guestInfo.next(info);
  }
  getGuestInfo(): Observable<Address | null> {
    return this.guestInfo.asObservable();
  }

  getGuest(addressId: any): Observable<Address> {
    const url = `https://localhost:7188/api/Guest/${addressId}`;
    return this.http.get<Address>(url);
  }

}
