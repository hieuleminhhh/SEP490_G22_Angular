import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ListOrderDetailByOrder } from '../models/orderDetail.model';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root'
})
export class ManagerOrderDetailService {
  private apiUrl = 'https://localhost:7188/api';

  constructor(private http: HttpClient) { }

  getOrderDetail(orderId: number): Observable<ListOrderDetailByOrder> {
    const url = `${this.apiUrl}/orders/${orderId}`;
    return this.http.get<ListOrderDetailByOrder>(url, httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
