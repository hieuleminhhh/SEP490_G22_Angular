import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CookingService {
  constructor(private http: HttpClient) { }

  getOrders(type:string): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/${type}`;
    return this.http.get(url);
  }


  updateDishesServed(request:any): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/update-dishes-served`;
    return this.http.put(url, request);
  }
}
