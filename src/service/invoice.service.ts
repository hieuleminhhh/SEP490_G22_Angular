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

  getStatistics(dateStart: any, dateEnd: any, id: number): Observable<any> {
    let url;
    if (id !== null) {
      url = `https://localhost:7188/api/orders/statistics?startDate=${dateStart}&endDate=${dateEnd}&collectedById=${id}`;
    } else {
      url = `https://localhost:7188/api/orders/statistics?startDate=${dateStart}&endDate=${dateEnd}`;
    }
    return this.http.get<any>(url, this.getHttpOptions());
  }

  getReport(dateStart: any, dateEnd: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/cashier-report?startDate=${dateStart}&endDate=${dateEnd}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }
  getCancelOrder(): Observable<any> {
    const url = `https://localhost:7188/api/Invoice/GetCancelOrder`;
    return this.http.get<any>(url, this.getHttpOptions());
  }
  getOrderShip(): Observable<any> {
    const url = `https://localhost:7188/api/Invoice/OrderUnpaidForShip`;
    return this.http.get<any>(url, this.getHttpOptions());
  }

  updatePayment(id: number, data: any): Observable<any> {
    const url = `https://localhost:7188/api/Invoice/updatePaymentStatus/${id}`;
    return this.http.put<any>(url, data, this.getHttpOptions());
  }

  updateOrderStatus(orderId: number, status: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/${orderId}/Updatestatus`;
    return this.http.put(url, status, this.getHttpOptions());
  }
  getOrderDetail(id: number): Observable<any> {
    const url = `https://localhost:7188/api/orders/${id}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }

  getOrderExport(request: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/order/export/cashier?exportorderIds=${request}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }

  updateOInvoice(body: any): Observable<any> {
    const url = `https://localhost:7188/api/Invoice/update-invoice`;
    return this.http.put(url, body, this.getHttpOptions());
  }

  updateOStatusReser(body: any): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/update-reservation-status`;
    return this.http.put(url, body, this.getHttpOptions());
  }

  updateStaffId(data: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/update-staff`;
    return this.http.put<any>(url, data, this.getHttpOptions());
  }

  getOrderPaymentOnline(dateStart: any, dateEnd: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/total-payment-amount?startDate=${dateStart}&endDate=${dateEnd}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }

  getOrderById(id:number): Observable<any> {
    const url = `https://localhost:7188/api/orders/${id}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }
}
