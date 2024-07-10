import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CookingService {
  constructor(private http: HttpClient) { }

  getOrders(type:string): Observable<any> {
    const url = `https://localhost:7188/api/OrderDetailsForChef/Type ${type}`;
    return this.http.get(url);
  }

}
