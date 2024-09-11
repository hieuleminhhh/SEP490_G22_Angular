import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  constructor(private http: HttpClient, private authService: AuthService) { }

  getTables(): Observable<any> {
    const url = `https://localhost:7188/api/Tables`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(url, { headers });
  }

  updateStatusTable(tableId: number): Observable<any> {
    const url = `https://localhost:7188/api/Table/${tableId}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(url, { headers });
  }

  createTableReservation(tableReser: any): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/register-tables`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(url, tableReser, { headers });
  }
  getOrdersByTableId(tableId: number): Observable<any> {
    const url = `https://localhost:7188/api/orders/GetOrderByTableId/${tableId}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(url, { headers });
  }
  updateOrderStatus(orderId: number, status: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/${orderId}/Updatestatus`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(url, status, { headers });
  }

  createTableOrder(tableOrder: any): Observable<any> {
    const url = `https://localhost:7188/api/TableReservation/CreateOrderandTable`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(url, tableOrder, { headers });
  }

  getTablesById(id: number): Observable<any> {
    const url = `https://localhost:7188/api/Tables/${id}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(url, { headers });
  }

  deleteTables(id: number): Observable<any> {
    const url = `https://localhost:7188/api/TableReservation/${id}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(url, { headers });
  }
  createTables(body: any): Observable<any> {
    const url = `https://localhost:7188/api/Tables`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(url, body, { headers });
  }
  updateTable(id:number, body:any): Observable<any> {
    const url = `https://localhost:7188/api/Tables/${id}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(url, body, { headers });
  }
  deleteTable(id: number): Observable<any> {
    const url = `https://localhost:7188/api/Tables/${id}`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.delete(url, { headers });
  }

  getTablesEmpty(): Observable<any> {
    const url = `https://localhost:7188/api/Tables/status2-floor-null`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(url, { headers });
  }

  updateFloor( body:any): Observable<any> {
    const url = `https://localhost:7188/api/Tables/update-floor`;
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.put(url, body, { headers });
  }
}

