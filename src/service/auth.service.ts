import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor() {}

  // Method to get the token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Method to set the token in localStorage
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Method to clear the token from localStorage
  clearToken(): void {
    localStorage.removeItem('token');
  }
  setAccountId(accountId: number): void {
    localStorage.setItem('accountId', accountId.toString());
  }

  getAccountId(): number {
    const id = localStorage.getItem('accountId');
    return id ? +id : 0;
  }
  getUser() {
    const token = localStorage.getItem('token'); 
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = decodeURIComponent(atob(base64Url).replace(/\+/g, ' '));
        const decodedToken = JSON.parse(base64);
        return {
          role: decodedToken.role, 
        };
      } catch (e) {
        console.error('Error decoding token', e);
        return null;
      }
    }
    return null;
  }

}


