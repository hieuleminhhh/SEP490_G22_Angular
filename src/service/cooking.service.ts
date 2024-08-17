import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CookingService {
  constructor(private http: HttpClient) { }

  getOrders(type: string): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/${type} orderdetails`;
    return this.http.get(url);
  }


  updateDishesServed(request: any): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/update-dishes-served`;
    return this.http.put(url, request);
  }

  getOrdersDish(key: string): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/searchforstaff?keyword=${key}`;
    return this.http.get(url);
  }

  getOrdersTakeaway(): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/stafftype1-2`;
    return this.http.get(url);
  }
  getShipStaff(): Observable<any> {
    const url = `https://localhost:7188/api/Account/role/ship`;
    return this.http.get(url);
  }
  updateAccountForOrder(orderId: number, accountId: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/update-account/${orderId}`;
    return this.http.put(url, accountId);
  }


  updateOrderStatus(orderId: number, status: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/${orderId}/Updatestatus`;
    return this.http.put(url, status);
  }

  getListShip(status:number, accountId:number): Observable<any> {
    const url = `https://localhost:7188/api/orders/orders/status/${status}/account/${accountId}`;
    return this.http.get(url);
  }

}
