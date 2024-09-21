import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class NotificationService {
  constructor(private http: HttpClient) { }

  getNotificationById(id: number): Observable<any> {
    const url = `https://localhost:7188/api/Notifications/account/${id}`;
    return this.http.get(url);
  }

  updateIsView(id: number): Observable<any> {
    const url = `https://localhost:7188/api/Notifications/UpdateIsView/${id}`;
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.put(url, {}, { headers });
  }

  createNotification(body:any): Observable<any> {
    const url = `https://localhost:7188/api/Notifications`;
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post(url, body, { headers });
  }
  getNotificationByType(id: number): Observable<any> {
    const url = `https://localhost:7188/api/Notifications/type/${id}`;
    return this.http.get(url);
  }
  getType(id: number): Observable<any> {
    const url = `https://localhost:7188/api/Account/GetTypeNotificationByAccountId/${id}`;
    return this.http.get(url);
  }
}
