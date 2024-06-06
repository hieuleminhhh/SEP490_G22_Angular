import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AddNewDish, ListAllDishes, ManagerDish } from '../models/dish.model';
import { Category } from '../models/category.model';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root'
})
export class ManagerDishService {
  private apiUrl = 'https://localhost:7188/api';
  

  constructor(private http: HttpClient) { }
  ListDishes(page: number = 1, pageSize: number = 10, search: string = ''): Observable<ListAllDishes> {
    let params = new HttpParams()
        .set('page', page.toString())
        .set('pageSize', pageSize.toString())
        .set('search', search.toString());
        const url = `${this.apiUrl}/Dish/ListDishes`;
        console.log('Request URL:', url, 'Params:', params.toString());  
    return this.http.get<ListAllDishes>(`${this.apiUrl}/Dish/ListDishes`, { params });
  }
    AddNewDish(newDish: AddNewDish): Observable<AddNewDish> {
      return this.http.post<AddNewDish>(this.apiUrl+'/Dish', newDish, httpOptions);
    }
    UpdateDish(updatedDish: ManagerDish): Observable<ManagerDish> {
      const url = '${this.apiUrl}/${updatedDish.id}';
      return this.http.put<ManagerDish>(url, updatedDish, httpOptions);
    }
    DeleteDish(dishId: number): Observable<void> {
      const url = '${this.apiUrl}/${dishId}';
      return this.http.delete<void>(url, httpOptions);
    }
    GetCategories(): Observable<Category[]> {
      return this.http.get<Category[]>(this.apiUrl+'/Category');
    }
    UploadImage(image: File): Observable<{ imageUrl: string }> {
      const formData = new FormData();
      formData.append('image', image);
  
      return this.http.post<{ imageUrl: string }>(this.apiUrl+'/Image/upload', formData);
    }
    GetImageUrl(fileName: string): string {
      return this.apiUrl+'/Image/getImage/fileName';
    }
    UpdateDishStatus(dishId: number, isActive: boolean): Observable<any> {
      const url = `${this.apiUrl}/Dish/${dishId}/status`;
      return this.http.patch<any>(url, { isActive });
    }
}

