import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AddNewOrder, ListAllOrder } from '../models/order.model';
import { Address } from '../models/address.model';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root'
})
export class ManagerOrderService {
    private apiUrl = 'https://localhost:7188/api';

  constructor(private http: HttpClient) { }
  ListOrders(page: number = 1, pageSize: number = 10, search: string = '', dateFrom: string = '', dateTo: string = '', status: number = 0, filterByDate: string = '', type: number = 0): Observable<ListAllOrder> {
    let params = new HttpParams()
        .set('page', page.toString())
        .set('pageSize', pageSize.toString())
        .set('search', search)
        .set('dateFrom', dateFrom)
        .set('dateTo', dateTo)
        .set('status', status.toString())
        .set('filterByDate', filterByDate)
        .set('type', type.toString());

    const url = `${this.apiUrl}/orders/GetListOrder`;
    console.log('Request URL:', url, 'Params:', params.toString());  
    return this.http.get<ListAllOrder>(url, { params });
  }
  UpdateOrderStatus(orderId: number, status: number): Observable<any> {
    const url = `${this.apiUrl}/orders/${orderId}/status`;
    return this.http.patch<any>(url, { status });
  }
  AddNewOrder(newOrder: AddNewOrder): Observable<any> {
    const url = `${this.apiUrl}/Cart/AddNewOrder`;
    return this.http.post<any>(url, newOrder, httpOptions);
  }
  ListAddress(): Observable<Address[]> {
    const url = `${this.apiUrl}/Guest/ListAddress`;
    return this.http.get<Address[]>(url);
  }
}

