import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ListAllOrder } from '../models/order.model';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root'
})
export class ManagerOrderService {
    private apiUrl = 'https://localhost:7188/api';

  constructor(private http: HttpClient) { }
  ListOrders(page: number = 1, pageSize: number = 10, search: string = ''): Observable<ListAllOrder> {
    let params = new HttpParams()
        .set('page', page.toString())
        .set('pageSize', pageSize.toString())
        .set('search', search.toString());
        const url = `${this.apiUrl}/orders/GetListOrde`;
        console.log('Request URL:', url, 'Params:', params.toString());  
    return this.http.get<ListAllOrder>(`${this.apiUrl}/orders/GetListOrder`, { params });
  }
  UpdateOrderStatus(orderId: number, status: number): Observable<any> {
    const url = `${this.apiUrl}/orders/${orderId}/status`;
    return this.http.patch<any>(url, { status });
  }
}

