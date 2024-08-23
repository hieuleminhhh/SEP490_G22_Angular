import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../../service/account.service';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule] // Thêm FormsModule vào imports
})
export class LoginComponent implements OnInit {
  loggedIn: boolean = false;
  username: string = '';
  password: string = '';
  token: string = '';
  errorMessage: string | null = null; 
  successMessage: string | null = null;
  constructor(private accountService: AccountService,  private router: Router) { 
    this.accountService.isLoggedIn().subscribe({
      next: loggedIn => {
        this.loggedIn = loggedIn;
      },
      error: error => {
        console.error('Error in isLoggedIn:', error);
      }
    });    
  }

  login() {
    this.accountService.login(this.username, this.password).subscribe({
      next: response => {
        console.log('Login successful');
        console.log('Token:', response.token);
        console.log('Role:', response.role);
        console.log('Account ID:', response.accountId);

        // Store token and role in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('accountId', response.accountId.toString());

        // Handle user roles and navigate accordingly
        this.handleUserRole(response.role);
        this.successMessage = 'Đăng nhập thành công!';
    
        this.errorMessage = null;
        setTimeout(() => {
          //
        }, 2000); 
      },
      error: error => {
        console.error('Login failed', error);
        this.errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.';
      }
    });
  }
  
  handleUserRole(role: string) {
    switch (role) {
      case 'Chef':
        window.location.href = '/cooking';
        break;
      case 'Cashier':
        window.location.href = '/dashboard';
        break;
      case 'Admin':
        window.location.href = '/setting';
        break;
      case 'Manager':
        window.location.href = '/managerdish';
        break;
      case 'OrderStaff':
        window.location.href = '/listTable';
        break;
      case 'Ship':
        window.location.href ='/shipping';
        break;
      default:
        console.error('Unknown role:', role);
        break;
    }
  }
  

  

  ngOnInit() {
  }  
}
