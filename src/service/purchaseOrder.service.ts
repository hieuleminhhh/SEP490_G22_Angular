import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private apiUrl = 'https://localhost:7188/api/orders/search'; // URL API thực tế

  constructor(private http: HttpClient) { }

  getOrders(phoneNumber: string): Observable<any> {
    const urlWithPhoneNumber = `${this.apiUrl}?GuestPhone=${phoneNumber}`;
    return this.http.get<any>(urlWithPhoneNumber);
  }

  checkPhone(guestPhone: string): Observable<boolean> {
    const url = `https://localhost:7188/api/Guest/phoneExists/${guestPhone}`;
    return this.http.get<{ exists: boolean }>(url).pipe(
      map(response => response.exists)
    );
  }
  sendSms(): Observable<any> {
    const apiUrl = 'https://localhost:7188/api/SendSMSAPI';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(apiUrl, { headers });
  }
  getOrdersPurchase(accountId: number): Observable<any> {
    const url = `https://localhost:7188/api/Cart/account/${accountId}`;
    return this.http.get<any>(url);
  }

  getOrderDetail(orderId: number): Observable<any> {
    const url = `https://localhost:7188/api/orders/${orderId}`;
    return this.http.get<any>(url);
  }

}
