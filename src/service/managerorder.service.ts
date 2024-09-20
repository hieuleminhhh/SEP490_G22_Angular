import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddNewOrderResponse, ListAllOrder, ManagerOrderByTableId } from '../models/order.model';
import { AddNewAddress, Address } from '../models/address.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ManagerOrderService {
  private apiUrl = 'https://localhost:7188/api';

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
    return this.http.get<ListAllOrder>(url, { params, ...this.getHttpOptions() });
  }

  UpdateOrderStatus(orderId: number, status: number): Observable<any> {
    const url = `${this.apiUrl}/orders/${orderId}/status`;
    return this.http.patch<any>(url, { status }, this.getHttpOptions());
  }

  AddNewOrder(newOrder: any): Observable<AddNewOrderResponse> {
    const url = `${this.apiUrl}/Cart/AddNewOrderTakeAway`;
    return this.http.post<AddNewOrderResponse>(url, newOrder, this.getHttpOptions());
  }

  ListAddress(): Observable<Address[]> {
    const url = `${this.apiUrl}/Guest/ListAddress`;
    return this.http.get<Address[]>(url, this.getHttpOptions());
  }

  AddNewAddress(newAddress: AddNewAddress): Observable<any> {
    const url = `${this.apiUrl}/Guest/CreateGuest`;
    return this.http.post<any>(url, newAddress, this.getHttpOptions());
  }

  getOrdersByTableId(tableId: number): Observable<any> {
    const url = `${this.apiUrl}/orders/getOrderByTableId?tableId=${tableId}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }

  createOrderOffline(orderData: any): Observable<any> {
    const url = `${this.apiUrl}/orders/createOrderForTable/${orderData.tableId}`;
    return this.http.post<any>(url, orderData, this.getHttpOptions());
  }
  createOrderReservation(orderData: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/createOrderForReservation/${orderData.tableId}`;
    return this.http.post<any>(url, orderData, this.getHttpOptions());
  }

  updateOrderOffline(tableId: number, dto: any): Observable<any> {
    const url = `${this.apiUrl}/orders/updateOrderDetails/${tableId}`;
    return this.http.post<any>(url, dto, this.getHttpOptions());
  }
  updateOrderDetail(orderId: number): Observable<any> {
    const url = `https://localhost:7188/api/orders/update-total-amount/${orderId}`;
    return this.http.put<any>(url,  this.getHttpOptions());
  }

  getOrderById(orderId: number): Observable<any> {
    const url = `${this.apiUrl}/orders/GetOrderDetails/${orderId}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }

  CancelOrderForTable(tableId: number, status: number): Observable<any> {
    const url = `${this.apiUrl}/orders/CancelOrderForTable/${tableId}`;
    return this.http.put<any>(url, { status }, this.getHttpOptions());
  }

  getQuantityOrderDetails(orderId: number): Observable<any> {
    const url = `${this.apiUrl}/orders/GetDishOrderDetails/${orderId}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }

  updateOrderDetailsByOrderId(orderId: number, dto: any): Observable<any> {
    const url = `${this.apiUrl}/orders/updateOrderDetailsByOrderId/${orderId}`;
    return this.http.post<any>(url, dto, this.getHttpOptions());
  }

  updateOrderStatus(orderId: number, status: number): Observable<any> {
    const url = `${this.apiUrl}/Invoice/updateStatus/${orderId}`;
    return this.http.put(url, { status }, { ...this.getHttpOptions(), responseType: 'text' });
  }

  updateOrderStatus1(orderId: number, data: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/updateStatus/${orderId}`;
    return this.http.put(url, data, this.getHttpOptions());
  }

  updateAmountReceiving(orderId: number, data: any): Observable<any> {
    const url = `${this.apiUrl}/orders/UpdateAmountReceiving/${orderId}`;
    return this.http.put<any>(url, data, this.getHttpOptions());
  }

  CancelOrder(orderId: number, cancelationData: { cancelationReason: string }): Observable<any> {
    const url = `https://localhost:7188/api/orders/CancelOrderReason/${orderId}`;
    return this.http.put(url, cancelationData, this.getHttpOptions());
  }

  AcceptOrderWaiting(orderId: number, data: any): Observable<any> {
    const url = `${this.apiUrl}/orders/AcceptOrder/${orderId}`;
    return this.http.post<any>(url, data, this.getHttpOptions());
  }
  getTableByReser(id: number): Observable<any> {
    const url = `https://localhost:7188/api/TableReservation/${id}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }
  createOrderTable(orderData: any): Observable<any> {
    const url = `https://localhost:7188/api/OrderTable`;
    return this.http.post<any>(url, orderData, this.getHttpOptions());
  }
  updateOrderReser(data: any): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/update-order`;
    return this.http.put(url, data, this.getHttpOptions());
  }
  sendOrderEmail(orderId: number): Observable<any> {
    const url = `${this.apiUrl}/orders/${orderId}/email`;
    return this.http.get<any>(url, this.getHttpOptions());
  }
  sendEmail(toEmail: string, subject: string, body: string): Observable<any> {
    const url = `${this.apiUrl}/Email/send-email`;
    const emailData = { toEmail, subject, body };
    return this.http.post<any>(url, emailData, this.getHttpOptions());
  }

  updateAcceptBy( body: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/UpdateAcceptBy`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(url, body, { headers });
  }
}
