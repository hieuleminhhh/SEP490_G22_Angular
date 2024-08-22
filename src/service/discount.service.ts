import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service'; // Import the AuthService

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  getListDiscount(): Observable<any> {
    const url = `https://localhost:7188/api/Discounts`;
    return this.http.get(url, this.getHttpOptions());
  }

  getListDish(): Observable<any> {
    const url = `https://localhost:7188/api/Dish`;
    return this.http.get(url, this.getHttpOptions());
  }

  createDiscount(request: any): Observable<any> {
    const url = `https://localhost:7188/api/Discounts`;
    return this.http.post(url, request, this.getHttpOptions());
  }

  updateDishDiscountId(discountId: number, dishIds: number[]): Observable<any> {
    const url = `https://localhost:7188/api/Dish/${discountId}/dishes`;
    return this.http.put(url, dishIds, this.getHttpOptions()).pipe(
      catchError(error => {
        console.error('Error occurred:', error);
        return throwError(error);
      })
    );
  }

  getActiveDiscounts(): Observable<any> {
    const url = `https://localhost:7188/api/Discounts/active`;
    return this.http.get(url, this.getHttpOptions());
  }

  getDetailDiscounts(id: number): Observable<any> {
    const url = `https://localhost:7188/api/Discounts/${id}`;
    return this.http.get(url, this.getHttpOptions());
  }

  getDiscountByOrderId(orderId: number): Observable<any> {
    const url = `https://localhost:7188/api/Discounts/GetDiscountByOrderId/${orderId}`;
    return this.http.get(url, this.getHttpOptions());
  }
}
