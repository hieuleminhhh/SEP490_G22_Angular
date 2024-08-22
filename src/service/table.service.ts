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
    return this.http.get(url);
  }

  createTableReservation(tableReser: any): Observable<any> {
    const url = `https://localhost:7188/api/Reservations/register-tables`;
    return this.http.post(url, tableReser);
  }
  getOrdersByTableId(tableId: number): Observable<any> {
    const url = `https://localhost:7188/api/orders/GetOrderByTableId/${tableId}`;
    return this.http.get(url);
  }
  updateOrderStatus(Id: number, request:any): Observable<any> {
    const url = `https://localhost:7188/api/Invoice/updateStatus/${Id}`;
    return this.http.put(url, request);
  }
}

