import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Dish } from '../models/dish.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Address } from '../models/address.model';
import { TableReservationResponse } from '../models/table.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private cartItems: Dish[] = [];
  private cartSubject = new BehaviorSubject<Dish[]>([]);
  private itemCountSubject = new BehaviorSubject<number>(0);
  isReser: boolean = false;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router, private authService: AuthService) {

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

  getReservation(reservationId: number): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/${reservationId}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(url, { headers });
  }
  getReservationList(status?: number): Observable<any> {
    const baseUrl = 'https://localhost:7188/api/Reservations';
    const url = status !== undefined ? `${baseUrl}?status=${status}` : baseUrl;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(url, { headers });
  }
  createResevetion(reservation: any): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/create`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(url, reservation, { headers });
  }

  updateStatusReservation(reservationId: number, status: any): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/${reservationId}/update-status`;
    const payload = { status: status };
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(url, payload, { headers });
  }
  updatereasonCancel(reservationId: number, cancelData: any): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/${reservationId}/reason-cancel`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(url, cancelData, { headers });
  }
  updateAcceptBy( body: any): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/UpdateReservationAcceptBy`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(url, body, { headers });
  }

  updateStatusTable(reservationId: number, status: any): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/${reservationId}/tables/status`;
    const payload = { tableStatus: status };  // Cập nhật tên trường
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(url, payload, { headers });
  }


  searchReservation(searchTerm: string): Observable<any[]> {
    const url = `https://localhost:7188/api/Reservations/searchNameOrPhone?guestNameOrguestPhone=${searchTerm}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any[]>(url, { headers });
  }

  getTableReservation(reserId: number): Observable<TableReservationResponse> {
    const url = `https://localhost:7188/api/Reservations/check-time/${reserId}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<TableReservationResponse>(url, { headers });
  }
  getReservationByOrderId(orderId: number): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/GetReservationByOrderId/${orderId}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(url, { headers });
  }
  getReservationByTableId(tableId: number): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/GetReservationsByTableId/${tableId}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(url, { headers });
  }
  updateOrderStatus(orderId: number, status: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/${orderId}/Updatestatus`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(url, status, { headers });
  }

  checkValidTable(reservationTime: string, number: number): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/checkAvailability?reservationTime=${reservationTime}&guestNumber=${number}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(url, { headers });
  }

  getReservationed(date: string): Observable<TableReservationResponse> {
    const url = `https://localhost:7188/api/Reservations/byDate?reservationTime=${date}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<TableReservationResponse>(url, { headers });
  }

  getTable(date: string): Observable<TableReservationResponse> {
    const url = `https://localhost:7188/api/Tables/available-tables?reservationTime=${date}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<TableReservationResponse>(url, { headers });
  }

  updateTableReservation( body:any): Observable<any> {
    const url = `https://localhost:7188/api/TableReservation/update-reservation-tables`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(url, body, { headers });
  }
  getGuestEmailByReservationId(reservationId: number): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/${reservationId}/guest-email`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    });
    return this.http.get(url, { headers });
  }
  
}
