import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  constructor(private http: HttpClient) { }

  getListDiscount(): Observable<any> {
    const url = `https://localhost:7188/api/Discounts`;
    return this.http.get(url);
  }

  getListDish(): Observable<any> {
    const url = `https://localhost:7188/api/Dish`;
    return this.http.get(url);
  }


}
