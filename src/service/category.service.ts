import { HttpClient } from '@angular/common/http';
import { Category } from './../models/category.model';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Dish } from '../models/dish.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  getDishesByCategory(categoryName: string): Observable<Dish[]> {
    return this.http.get<Dish[]>(`https://localhost:7188/api/Category/dishes/${categoryName}`);
  }
}
