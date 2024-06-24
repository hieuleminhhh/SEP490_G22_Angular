import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  constructor(private http: HttpClient) { }

  getTables(): Observable<any> {
    const url = `https://localhost:7188/api/Tables`;
    return this.http.get(url);
  }


  updateStatusTable(tableId:number): Observable<any> {
    const url = `https://localhost:7188/api/Table/${tableId}`;
    return this.http.get(url);
  }


}
