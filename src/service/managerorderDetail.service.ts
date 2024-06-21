import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root'
})
export class ManagerOrderDetailService {
    private apiUrl = 'https://localhost:7188/api';

  constructor(private http: HttpClient) { }
  
  getOrderDetail(orderId: number): Observable<any> {
    const url = `${this.apiUrl}/orders/${orderId}`;
    return this.http.get<any>(url, httpOptions);
  }
}

