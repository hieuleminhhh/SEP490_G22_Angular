import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  private apiUrl = 'https://localhost:7188/api/News'; // Thay bằng URL API thực tế

  constructor(private http: HttpClient) { }

  getArticleById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  getArticle(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}`);
  }
}
