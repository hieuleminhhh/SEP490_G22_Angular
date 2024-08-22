import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Account, CreateAccountDTO, GetAccountDTO, UpdateAccountDTO } from '../models/account.model';
import { tap } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = 'https://localhost:7188/api';
  private loggedIn = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) { }

  private checkToken() {
    const token = localStorage.getItem('token');
    if (token) {
      this.loggedIn.next(true);
    }
  }

  login(username: string, password: string): Observable<Account> {
    const loginUrl = `${this.apiUrl}/Login`;
    return this.http.post<Account>(loginUrl, {username, password}, httpOptions).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.loggedIn.next(true);
        }
      })
    );
  }
  logout() {
    localStorage.removeItem('token');
    
    this.loggedIn.next(false);
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  getAllAccounts(): Observable<GetAccountDTO[]> {
    const url = `${this.apiUrl}/Account/getAll`;
    return this.http.get<GetAccountDTO[]>(url);
  }

  getAccountById(id: number): Observable<GetAccountDTO> {
    const url = `${this.apiUrl}/Account/getById/${id}`;
    return this.http.get<GetAccountDTO>(url);
  }

  createAccount(account: CreateAccountDTO): Observable<GetAccountDTO> {
    const url = `${this.apiUrl}/Account/create`;
    return this.http.post<GetAccountDTO>(url, account, httpOptions);
  }

  updateAccount(id: number, account: UpdateAccountDTO): Observable<GetAccountDTO> {
    const url = `${this.apiUrl}/Account/update/${id}`;
    return this.http.put<GetAccountDTO>(url, account, httpOptions);
  }
  updateAccountStatus(id: number, isActive: boolean): Observable<any> {
    const url = `${this.apiUrl}/Account/update-status/${id}`;
    return this.http.put<any>(url, isActive, { ...httpOptions, responseType: 'text' as 'json' });
  }
  private accountId: number | null = null;

  setAccountId(id: number): void {
    this.accountId = id;
  }

  getAccountId(): number | null {
    return this.accountId;
  }
  
  
  
  
}
