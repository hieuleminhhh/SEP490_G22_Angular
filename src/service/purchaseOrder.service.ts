import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private apiUrl = 'https://localhost:7188/api/orders/search'; // URL API thực tế

  constructor(private http: HttpClient) { }

  getOrders(phoneNumber: string): Observable<any> {
    // Thêm số điện thoại vào URL API dưới dạng tham số truy vấn
    const urlWithPhoneNumber = `${this.apiUrl}?GuestPhone=${phoneNumber}`;
    return this.http.get<any>(urlWithPhoneNumber);
  }

  checkPhone(guestPhone: string): Observable<boolean> {
    const url = `https://localhost:7188/api/Guest/phoneExists/${guestPhone}`;
    return this.http.get<{ exists: boolean }>(url).pipe(
      map(response => response.exists)
    );
  }
}
