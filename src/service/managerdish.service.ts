import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AddNewDish, ListAllDishes, ManagerDish, UpdateDish } from '../models/dish.model';
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
  ListDishes(page: number = 1, pageSize: number = 10, searchCategory: string = '', search: string = ''): Observable<ListAllDishes> {
    // Ensure default values are properly converted to strings
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('search', search ? search.toString() : '')
      .set('searchCategory', searchCategory ? searchCategory.toString() : '');
  
    const url = `${this.apiUrl}/Dish/ListDishes`;
  
    // Log the URL and parameters to verify correctness
    console.log('Request URL:', url);
    console.log('Params:', params.toString());
    console.log('Search Term:', search);
    console.log('Search Category:', searchCategory);
  
    return this.http.get<ListAllDishes>(url, { params });
  }
  
    getDishById(dishId: number): Observable<UpdateDish> {
    const url = `${this.apiUrl}/Dish/${dishId}`; 
    return this.http.get<UpdateDish>(url);
    } 
    AddNewDish(newDish: AddNewDish): Observable<AddNewDish> {
      return this.http.post<AddNewDish>(this.apiUrl+'/Dish', newDish, httpOptions)
        .pipe(
          catchError((error: any) => { 
            console.error('An error occurred:', error);
            return throwError(error);
          })
        );
    }
    UpdateDish(updatedDish: UpdateDish): Observable<UpdateDish> {
      const url = `${this.apiUrl}/Dish/${updatedDish.dishId}`;
      return this.http.put<UpdateDish>(url, updatedDish, httpOptions);
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

