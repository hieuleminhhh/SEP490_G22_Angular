import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class PaymentService {
  constructor(private http: HttpClient) { }

  updateResionCancle(id: number, reason: any): Observable<any> {
    const url = `https://localhost:7188/api/orders/CancelOrderReason/${id}`;
    return this.http.put(url, reason);
}


}
