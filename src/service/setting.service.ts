import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class SettingService {
  constructor(private http: HttpClient) { }

  getInfo(): Observable<any> {
    const url = `https://localhost:7188/api/Setting`;
    return this.http.get(url);
  }

  updateInfo(request:any): Observable<any> {
    const url = `https://localhost:7188/api/Setting/1`;
    return this.http.put(url, request);
  }


}
