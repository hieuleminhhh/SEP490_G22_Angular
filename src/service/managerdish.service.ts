import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AddNewDish, ListAllDishes, ManagerDish, UpdateDish } from '../models/dish.model';
import { Category } from '../models/category.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ManagerDishService {
  private apiUrl = 'https://localhost:7188/api';

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

  ListDishes(page: number = 1, pageSize: number = 10, searchCategory: string = '', search: string = ''): Observable<ListAllDishes> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('search', search ? search.toString() : '')
      .set('searchCategory', searchCategory ? searchCategory.toString() : '');

    const url = `${this.apiUrl}/Dish/ListDishes`;
    return this.http.get<ListAllDishes>(url, { params, ...this.getHttpOptions() });
  }
  ListAllDishes(page: number = 1, pageSize: number = 100, searchCategory: string = '', search: string = ''): Observable<ListAllDishes> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('search', search ? search.toString() : '')
      .set('searchCategory', searchCategory ? searchCategory.toString() : '');

    const url = `${this.apiUrl}/Dish/ListDishes`;
    return this.http.get<ListAllDishes>(url, { params, ...this.getHttpOptions() });
  }
  ListDishesActive(page: number = 1, pageSize: number = 10, searchCategory: string = '', search: string = ''): Observable<ListAllDishes> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('search', search ? search.toString() : '')
      .set('searchCategory', searchCategory ? searchCategory.toString() : '');

    const url = `${this.apiUrl}/Dish/ListDishesActive`;
    return this.http.get<ListAllDishes>(url, { params, ...this.getHttpOptions() });
  }
  getDishById(dishId: number): Observable<UpdateDish> {
    const url = `${this.apiUrl}/Dish/${dishId}`;
    return this.http.get<UpdateDish>(url, this.getHttpOptions());
  }

  AddNewDish(newDish: AddNewDish): Observable<AddNewDish> {
    return this.http.post<AddNewDish>(`${this.apiUrl}/Dish`, newDish, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('An error occurred:', error);
          return throwError(error);
        })
      );
  }

  UpdateDish(updatedDish: UpdateDish): Observable<UpdateDish> {
    const url = `${this.apiUrl}/Dish/${updatedDish.dishId}`;
    return this.http.put<UpdateDish>(url, updatedDish, this.getHttpOptions());
  }

  GetCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/Category`, this.getHttpOptions());
  }

  UploadImage(image: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', image);
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/Image/upload`, formData, { headers });
  }

  GetImageUrl(fileName: string): string {
    return `${this.apiUrl}/Image/getImage/${fileName}`;
  }

  UpdateDishStatus(dishId: number, isActive: boolean): Observable<any> {
    const url = `${this.apiUrl}/Dish/${dishId}/status`;
    return this.http.patch<any>(url, { isActive }, this.getHttpOptions());
  }

  UpdateDishQuantity(body:any): Observable<any> {
    const url = `https://localhost:7188/api/Dish/update-quantity`;
    return this.http.put<any>(url, body, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('An error occurred:', error);
          return throwError(error);
        })
      );
  }
  checkDishInOrderDetails(dishId: number): Observable<boolean> {
    const url = `${this.apiUrl}/orders/CheckDishInOrderDetails/${dishId}`;
    return this.http.get<boolean>(url, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('An error occurred while checking dish in order details:', error);
          return throwError(error);
        })
      );
  }
  DeleteDish(dishId: number): Observable<void> {
    const url = `${this.apiUrl}/Dish/${dishId}`;
    return this.http.delete<void>(url, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('An error occurred while deleting the dish:', error);
          return throwError(error);
        })
      );
  }
}
