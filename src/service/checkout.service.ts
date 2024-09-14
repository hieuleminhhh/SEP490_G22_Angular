import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  private apiUrl = 'https://localhost:7188/api/Cart/checkout';

  constructor(private http: HttpClient) { }

  submitOrder(order: any): Observable<any> {
    return this.http.post(this.apiUrl, order);
  }

  getVnPay(order: any): Observable<any> {
    const url = `https://localhost:7188/api/VnPay/checkout-order`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(url, JSON.stringify(order), { headers });
  }

  getVnPays(order: any): Observable<any> {
    const url = `https://localhost:7188/api/VnPay/checkout-reservation`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(url, JSON.stringify(order), { headers });
  }

  getListDiscount(): Observable<any> {
    const url = `https://localhost:7188/api/Discounts/active`;
    return this.http.get<any>(url);
  }

  getRemainingItems(order: any): Observable<any> {
    const url = `https://localhost:7188/api/Cart/GetRemainingItems`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(url, JSON.stringify(order), { headers });
  }
}
