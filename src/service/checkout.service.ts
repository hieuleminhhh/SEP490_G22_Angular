import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}
