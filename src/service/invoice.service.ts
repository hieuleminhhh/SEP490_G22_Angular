import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = 'https://localhost:7188/api';

  constructor(private http: HttpClient) { }

  createInvoiceOffline(invoiceData: any): Observable<any> {
    const url = `${this.apiUrl}/Invoice/create-invoice/${invoiceData.orderId}`;
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

}
