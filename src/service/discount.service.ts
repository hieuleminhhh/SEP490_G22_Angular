import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  constructor(private http: HttpClient) { }

  getListDiscount(): Observable<any> {
    const url = `https://localhost:7188/api/Discounts`;
    return this.http.get(url);
  }

  getListDish(): Observable<any> {
    const url = `https://localhost:7188/api/Dish`;
    return this.http.get(url);
  }
  createDiscount(request: any): Observable<any> {
    const url = `https://localhost:7188/api/Discounts`;
    return this.http.post(url, request);
  }

  updateDishDiscountId(discountId: number, dishIds: number[]): Observable<any> {
    const url = `https://localhost:7188/api/Dish/${discountId}/dishes`;
    return this.http.put(url, dishIds, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      })
    }).pipe(
      catchError(error => {
        console.error('Error occurred:', error);
        return throwError(error);
      })
    );
  }
  getActiveDiscounts(): Observable<any> {
    const url = `https://localhost:7188/api/Discounts/active`;
    return this.http.get(url);
  }
}
