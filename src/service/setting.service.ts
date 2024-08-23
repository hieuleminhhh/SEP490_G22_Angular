import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Import the AuthService

@Injectable({
  providedIn: 'root'
})
export class SettingService {
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

  getInfo(): Observable<any> {
    const url = `https://localhost:7188/api/Setting`;
    return this.http.get(url, this.getHttpOptions());
  }

  updateInfo(request: any): Observable<any> {
    const url = `https://localhost:7188/api/Setting/1`;
    return this.http.put(url, request, this.getHttpOptions());
  }
  UploadImage(image: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', image);
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<{ imageUrl: string }>(`https://localhost:7188/api/Image/upload`, formData, { headers });
  }

}
