import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Account, CreateAccountDTO, GetAccountDTO, UpdateAccountDTO } from '../models/account.model';
import { map, tap } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private apiUrl = 'https://localhost:7188/api';
  private loggedIn = new BehaviorSubject<boolean>(false);
  private accountId: number | null = null;

  constructor(private http: HttpClient) {
    this.checkToken(); // Check token on initialization
  }

  private checkToken() {
    const token = localStorage.getItem('token');
    if (token) {
      this.loggedIn.next(true);
    }
  }

  login(username: string, password: string): Observable<Account> {
    const loginUrl = `${this.apiUrl}/Login`;
    return this.http.post<Account>(loginUrl, { username, password }, httpOptions).pipe(
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
  changeProfile(accountId: number, account: any): Observable<any>{
    const url = `${this.apiUrl}/Account/${accountId}`;
    return this.http.put<any>(url, account, httpOptions);
  }
  changePassword(accountId: number, account:any): Observable<any>{
    const url = `${this.apiUrl}/Account/changepassword/${accountId}`;
    return this.http.put<any>(url, account, httpOptions);
  }
  updateAccountStatus(id: number, isActive: boolean): Observable<any> {
    const url = `${this.apiUrl}/Account/update-status/${id}`;
    return this.http.put<any>(url, isActive, { ...httpOptions, responseType: 'text' as 'json' });
  }
  setAccountId(id: number): void {
    this.accountId = id;
  }

  getAccountId(): number | null {
    return this.accountId;
  }
  googleLogin(code: string): Observable<any> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const clientId = '21202956432-pdk6dbthlbnb9mspamh3cgl03dceeoah.apps.googleusercontent.com';
    const clientSecret = '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'; 
    const redirectUri = 'http://localhost:4200/auth/callback';
    const grantType = 'authorization_code';
  
    const body = new URLSearchParams();
    body.set('code', code);
    body.set('client_id', clientId);
    body.set('client_secret', clientSecret);
    body.set('redirect_uri', redirectUri);
    body.set('grant_type', grantType);
  
    return this.http.post<any>(tokenUrl, body.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    }).pipe(
      map(response => response.access_token)
    );
  }
  

  getGoogleUserProfile(accessToken: string) {
    const profileUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    return this.http.get<any>(profileUrl, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${accessToken}`
      })
    });
  }
  registerGoogleAccount(email: string): Observable<any> {
    const url = `${this.apiUrl}/GoogleAuth/register`;
    const body = { email };
  
    return this.http.post<any>(url, body, httpOptions).pipe(
      tap(response => {
        console.log('Google account registered:', response);
      })
    );
  }
  sendOtp(email: string): Observable<any> {
    const url = `${this.apiUrl}/GoogleAuth/Send-OTP`;
    const body = { email };
    
    return this.http.post<any>(url, body, httpOptions).pipe(
      tap(response => {
        console.log('OTP sent to:', email);
      })
    );
  }
  verifyOtp(email: string, otp: string): Observable<any> {
    const url = `${this.apiUrl}/GoogleAuth/verify-otp`;
    const body = { email, otp };
  
    return this.http.post<any>(url, body, httpOptions).pipe(
      tap(response => {
        console.log('OTP verification response:', response);
      })
    );
  }
  updateAccountRole(accountId: number, role: string): Observable<any> {
    const url = `${this.apiUrl}/Account/${accountId}/role`;
    const body = { role };
  
    return this.http.put(url, body, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      responseType: 'text' as 'json'  // Explicitly expect a text response
    });
  }
  forgotPassword(email: string): Observable<any> {
    const url = `${this.apiUrl}/Account/ForgotPassword`;
    const body = { email };
  
    return this.http.post<any>(url, body, httpOptions).pipe(
      tap(response => {
        console.log('Forgot password request sent:', response);
      })
    );
  }
  register(body: any): Observable<any> { 
    const url = `${this.apiUrl}/Account/register`;
  
    return this.http.post<any>(url, body, httpOptions).pipe(
      tap(response => {
        console.log('Account registered:', response);
      })
    );
  }
  verifyAccount(body: any): Observable<any> {
    const url = `${this.apiUrl}/Account/verify`;
    return this.http.post<any>(url, body, httpOptions).pipe(
      tap(response => {
        console.log('Account verification response:', response);
      })
    );
  }
  checkAccountIdByOrderId(orderId: number): Observable<any> {
    const url = `${this.apiUrl}/orders/checkAccountID?orderId=${orderId}`;
    return this.http.get<any>(url, {
      headers: new HttpHeaders({
        'Accept': '*/*'
      })
    }).pipe(
      tap(response => {
        console.log('Account ID checked for order:', response);
      })
    );
  }
  
  private userData: any = {};
  setData(data: any) {
    this.userData = data;
  }

  getData() {
    return this.userData;
  }
  private otpReceived: string | null = null;
  setOtp(otp: string) {
    this.otpReceived = otp;
  }

  getOtp() {
    return this.otpReceived;
  }
  
}
