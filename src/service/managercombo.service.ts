import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AddNewCombo, ListAllCombo, UpdateCombo } from '../models/combo.model';
import { Dish } from '../models/dish.model';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root'
})
export class ManagerComboService {
  private apiUrl = 'https://localhost:7188/api';
  

  constructor(private http: HttpClient) { }
    ListCombo(page: number = 1, pageSize: number = 10, search: string = ''): Observable<ListAllCombo> {
    let params = new HttpParams()
        .set('page', page.toString())
        .set('pageSize', pageSize.toString())
        .set('search', search.toString());
        const url = `${this.apiUrl}/Combo/ListCombo`;
    return this.http.get<ListAllCombo>(`${this.apiUrl}/Combo/ListCombo`, { params });
  }
    getAllDishes(): Observable<Dish[]> {
    const url = `${this.apiUrl}/Dish`;
    return this.http.get<Dish[]>(url);
  }
    getComboById(comboId: number): Observable<UpdateCombo> {
    const url = `${this.apiUrl}/Combo/GetComboById/${comboId}`; 
    return this.http.get<UpdateCombo>(url);
    } 
    AddNewCombo(newCombo: AddNewCombo): Observable<AddNewCombo> {
        return this.http.post<AddNewCombo>(this.apiUrl+'/Combo/CreateComboWithDishes', newCombo, httpOptions)
          .pipe(
            catchError((error: any) => { 
              console.error('An error occurred:', error);
              return throwError(error);
            })
          );
      }
      UpdateCombo(upDateCombo: UpdateCombo): Observable<UpdateCombo> {
        const url = `${this.apiUrl}/Combo/UpdateComboWithDishes/${upDateCombo.comboId}`;
        return this.http.put<UpdateCombo>(url, upDateCombo, httpOptions);
      }
      UploadImage(image: File): Observable<{ imageUrl: string }> {
        const formData = new FormData();
        formData.append('image', image);
    
        return this.http.post<{ imageUrl: string }>(this.apiUrl+'/Image/upload', formData);
      }
      GetImageUrl(fileName: string): string {
        return this.apiUrl+'/Image/getImage/fileName';
      }
      UpdateComboStatus(comboId: number, isActive: boolean): Observable<any> {
        const url = `${this.apiUrl}/Combo/${comboId}/status`;
        return this.http.patch<any>(url, { isActive });
      }
      AddComboDetails(comboDetails: any[]): Observable<any> {
        return this.http.post('/api/combo-details', comboDetails);
      }
}

