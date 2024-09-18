import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AddNewCombo, ListAllCombo, UpdateCombo } from '../models/combo.model';
import { Dish } from '../models/dish.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ManagerComboService {
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

  ListCombo(page: number = 1, pageSize: number = 10, search: string = ''): Observable<ListAllCombo> {
    let params = new HttpParams()
        .set('page', page.toString())
        .set('pageSize', pageSize.toString())
        .set('search', search.toString());

    const url = `${this.apiUrl}/Combo/ListCombo`;
    return this.http.get<ListAllCombo>(url, { params, ...this.getHttpOptions() });
  }
  ListComboActive(page: number = 1, pageSize: number = 10, search: string = ''): Observable<ListAllCombo> {
    let params = new HttpParams()
        .set('page', page.toString())
        .set('pageSize', pageSize.toString())
        .set('search', search.toString());

    const url = `${this.apiUrl}/Combo/ListComboActive`;
    return this.http.get<ListAllCombo>(url, { params, ...this.getHttpOptions() });
  }

  getAllDishes(): Observable<Dish[]> {
    const url = `${this.apiUrl}/Dish`;
    return this.http.get<Dish[]>(url, this.getHttpOptions());
  }

  getComboById(comboId: number): Observable<any> {
    const url = `${this.apiUrl}/Combo/GetComboById/${comboId}`;
    return this.http.get<any>(url, this.getHttpOptions());
  }

  AddNewCombo(newCombo: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Combo/CreateComboWithDishes`, newCombo, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('An error occurred:', error);
          return throwError(error);
        })
      );
  }

  UpdateCombo(upDateCombo: any): Observable<any> {
    const url = `${this.apiUrl}/Combo/UpdateComboWithDishes/${upDateCombo.comboId}`;
    return this.http.put<any>(url, upDateCombo, this.getHttpOptions());
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

  UpdateComboStatus(comboId: number, isActive: boolean): Observable<any> {
    const url = `${this.apiUrl}/Combo/${comboId}/status`;
    return this.http.patch<any>(url, { isActive }, this.getHttpOptions());
  }

  AddComboDetails(comboDetails: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/combo-details`, comboDetails, this.getHttpOptions());
  }
  UpdateComboQuantity(body:any): Observable<any> {
    const url = `https://localhost:7188/api/Combo/update-quantity`;
    return this.http.put<any>(url, body, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('An error occurred:', error);
          return throwError(error);
        })
      );
  }
  checkComboInOrderDetails(comboId: number): Observable<boolean> {
    const url = `${this.apiUrl}/orders/CheckComboInOrderDetails/${comboId}`;
    return this.http.get<boolean>(url, this.getHttpOptions());
  }
  DeleteCombo(comboId: number): Observable<void> {
    const url = `${this.apiUrl}/Combo/${comboId}`;
    return this.http.delete<void>(url, this.getHttpOptions())
      .pipe(
        catchError((error: any) => {
          console.error('An error occurred while deleting the combo:', error);
          return throwError(error);
        })
      );
  }
}
