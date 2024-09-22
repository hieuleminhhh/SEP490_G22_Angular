import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Import the AuthService

@Injectable({
  providedIn: 'root'
})
export class CookingService {
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

  getOrders(type: string): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/${type} orderdetails`;
    return this.http.get(url, this.getHttpOptions());
  }
  checkOrders(id: number): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/checkOrder/${id}`;
    return this.http.get(url, this.getHttpOptions());
  }

  updateDishesServed(request: any): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/update-dishes-served`;
    return this.http.put(url, request, this.getHttpOptions());
  }

  getOrdersDish(key: string): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/searchforstaff?keyword=${key}`;
    return this.http.get(url, this.getHttpOptions());
  }

  getOrdersTakeaway(): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/stafftype1-2`;
    return this.http.get(url, this.getHttpOptions());
  }

  getShipStaff(): Observable<any> {
    const url = `https://localhost:7188/api/Account/role/ship`;
    return this.http.get(url, this.getHttpOptions());
  }

  updateAccountForOrder(orderId: number, accountId: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/update-account/${orderId}`;
    return this.http.put(url, accountId, this.getHttpOptions());
  }

  updateOrderStatus(orderId: number, status: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/${orderId}/Updatestatus`;
    return this.http.put(url, status, this.getHttpOptions());
  }

  getListShip(status: number, accountId: number): Observable<any> {
    const url = `https://localhost:7188/api/orders/orders/status/${status}/staff/${accountId}`;
    return this.http.get(url, this.getHttpOptions());
  }

  getIngredient(name: string, quantity: number): Observable<any> {
    const url = `https://localhost:7188/api/Ingredient/search-by-dish-item-name?name=${name}&quantity=${quantity}`;
    return this.http.get(url, this.getHttpOptions());
  }

  updatecancelReason(orderId: number, body: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/CancelOrderReason/${orderId}`;
    return this.http.put(url, body, this.getHttpOptions());
  }
}
