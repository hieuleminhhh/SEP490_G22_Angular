import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Category } from './../models/category.model';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Dish } from '../models/dish.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private http: HttpClient,private authService: AuthService) {}
  private apiUrl = 'https://localhost:7188/api/Category';
  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }
  getDishesByCategory(categoryName: string): Observable<Dish[]> {
    return this.http.get<Dish[]>(`https://localhost:7188/api/Category/dishes/${categoryName}`);
  }
  getAllCategories(): Observable<any> {
    
    return this.http.get<any>(this.apiUrl, {
      headers: { 'accept': 'text/plain' }
    });
  }
  addCategory(categoryName: string): Observable<any> {
    const body = { categoryName };
    return this.http.post(this.apiUrl, body, this.getHttpOptions());
  }
}
