import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Import the AuthService

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
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

  createInvoiceOffline(orderId: number, invoiceData: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/create-invoice/${orderId}`;
    return this.http.post<any>(url, invoiceData, this.getHttpOptions());
  }

  getInvoiceById(invoiceId: number): Observable<any> {
    const url = `${this.apiUrl}/Invoice/${invoiceId}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }

  updateInvoice(invoiceId: number, invoiceData: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/updateInvoice/${invoiceId}`;
    return this.http.put<any>(url, invoiceData, this.getHttpOptions());
  }

  updateStatusAndCreateInvoice(orderId: number, updateData: any): Observable<any> {
    const url = `${this.apiUrl}/orders/updateStatusAndCreateInvoice/${orderId}`;
    return this.http.put<any>(url, updateData, this.getHttpOptions());
  }

  getInvoiceByOrderId(orderId: number): Observable<any> {
    const url = `${this.apiUrl}/Invoice/GetInvoiceByOrderID/${orderId}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }

  updateOrderAndInvoice(orderId: number, data: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/UpdateOrderAndInvoice/${orderId}`;
    return this.http.put<any>(url, data, this.getHttpOptions());
  }

  updateDepositAndCreateInvoice(invoiceId: number, data: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/UpdateDepositAndCreateInvoice/${invoiceId}`;
    return this.http.put<any>(url, data, this.getHttpOptions());
  }

  createInvoiceForOrder(orderId: number, invoiceData: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/createInvoiceForOrder/${orderId}`;
    return this.http.post<any>(url, invoiceData, this.getHttpOptions());
  }
}
