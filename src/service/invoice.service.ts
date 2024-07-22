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
    return this.http.post<any>(url, {}, httpOptions);
  }
}
