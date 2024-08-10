import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CookingService {
  constructor(private http: HttpClient) { }

  getOrders(type:string): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/${type} orderdetails`;
    return this.http.get(url);
  }


  updateDishesServed(request:any): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/update-dishes-served`;
    return this.http.put(url, request);
  }

  getOrdersDish(key:string): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/searchforstaff?keyword=${key}`;
    return this.http.get(url);
  }

  getOrdersTakeaway(): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/stafftype1-2`;
    return this.http.get(url);
  }

  updateOrderStatus(orderId: number, status: any): Observable<string> {
    const url = `https://localhost:7188/api/Invoice/updateStatus/${orderId}`;
    return this.http.put(url, status, { responseType: 'text' }) // Yêu cầu phản hồi kiểu văn bản
      .pipe(
        map(response => {
          // Xử lý phản hồi thành công
          return response;
        }),
        catchError(error => {
          // Xử lý lỗi
          console.error('Error:', error);
          return of('Error occurred');
        })
      );
  }
}
