import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = 'https://localhost:7188/api';

  constructor(private http: HttpClient) { }

  createInvoiceOffline(orderId: number, invoiceData: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/create-invoice/${orderId}`;
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http.post<any>(url, invoiceData, httpOptions);
  }
  
  getInvoiceById(invoiceId: number): Observable<any> {
    const url = `${this.apiUrl}/Invoice/${invoiceId}`;
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http.get<any>(url, httpOptions);
  }
  updateInvoice(invoiceId: number, invoiceData: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/updateInvoice/${invoiceId}`;
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http.put<any>(url, invoiceData, httpOptions);
  }
  updateStatusAndCreateInvoice(orderId: number, updateData: any) {
    const url = `${this.apiUrl}/orders/updateStatusAndCreateInvoice/${orderId}`;
    return this.http.put(url, updateData);
  }
  getInvoiceByOrderId(orderId: number): Observable<any> {
    const url = `${this.apiUrl}/Invoice/GetInvoiceByOrderID/${orderId}`;
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http.get<any>(url, httpOptions);
  }
  updateOrderAndInvoice(invoiceId: number, data: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/UpdateOrderAndInvoice/${invoiceId}`;
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http.put<any>(url, data, httpOptions);
  }

  updateDepositAndCreateInvoice(invoiceId: number, data: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/UpdateDepositAndCreateInvoice/${invoiceId}`;
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http.put<any>(url, data, httpOptions);
  }
  createInvoiceForOrder(orderId: number, invoiceData: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/createInvoiceForOrder/${orderId}`;
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };
    return this.http.post<any>(url, invoiceData, httpOptions);
  }
  
}
