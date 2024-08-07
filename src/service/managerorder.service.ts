import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AddNewOrder, AddNewOrderResponse, ListAllOrder, ManagerOrderByTableId } from '../models/order.model';
import { AddNewAddress, Address } from '../models/address.model';

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
  AddNewOrder(newOrder: any): Observable<AddNewOrderResponse> {
    const url = `${this.apiUrl}/Cart/AddNewOrderTakeAway`;
    return this.http.post<AddNewOrderResponse>(url, newOrder, httpOptions);
  }
  ListAddress(): Observable<Address[]> {
    const url = `${this.apiUrl}/Guest/ListAddress`;
    return this.http.get<Address[]>(url);
  }
  AddNewAddress(newAddress: AddNewAddress): Observable<any> {
    const url = `${this.apiUrl}/Guest/CreateGuest`;
    return this.http.post<any>(url, newAddress, httpOptions);
  }
  getOrdersByTableId(tableId: number): Observable<any> {
    const url = `${this.apiUrl}/orders/getOrderByTableId?tableId=${tableId}`;
    return this.http.get<any>(url);
  }
  createOrderOffline(orderData: any): Observable<any> {
    const url = `${this.apiUrl}/orders/createOrderForTable/${orderData.tableId}`;
    return this.http.post<any>(url, orderData, httpOptions);
  }
  updateOrderOffline(tableId: number, dto: any): Observable<any> {
    const url = `${this.apiUrl}/orders/updateOrderDetails/${tableId}`;
    return this.http.post<any>(url, dto, httpOptions);
  }
  getOrderById(orderId: number): Observable<any> {
    const url = `${this.apiUrl}/orders/GetOrderDetails/${orderId}`;
    return this.http.get<any>(url);
  }  
  CancelOrderForTable(tableId: number, status: number): Observable<any> {
    const url = `${this.apiUrl}/orders/CancelOrderForTable/${tableId}`;
    return this.http.put<any>(url, { status }, httpOptions);
  }
  getQuantityOrderDetails(orderId: number): Observable<any> {
    const url = `${this.apiUrl}/orders/GetDishOrderDetails/${orderId}`;
    return this.http.get<any>(url);
  }
  updateOrderDetailsByOrderId(orderId: number, dto: any): Observable<any> {
    const url = `${this.apiUrl}/orders/updateOrderDetailsByOrderId/${orderId}`;
    return this.http.post<any>(url, dto, httpOptions); // or .put() if appropriate
  }
  updateOrderStatus(orderId: number, status: number): Observable<any> {
    const url = `${this.apiUrl}/Invoice/updateStatus/${orderId}`;
  
    return this.http.put(url, { status }, { responseType: 'text' });
  }
  
  
}

