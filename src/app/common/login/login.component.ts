import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../../service/account.service';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SettingService } from '../../../service/setting.service';

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
  logoUrl: string = '';
  settings: any;
  constructor(private accountService: AccountService,  private router: Router, private settingService: SettingService) { 
  }
  ngOnInit() {
    this.getInfo();
    this.loginWithGoogle();
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
  getInfo(): void {
    this.settingService.getInfo().subscribe(
      response => {
        this.settings = response;
        console.log(response);
        this.logoUrl = this.settings[0].logo;
        console.log('URL Logo',this.logoUrl);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  loginWithGoogle() {
    const googleAuth: any = (window as any).google;
  
    if (googleAuth && googleAuth.accounts) {
      googleAuth.accounts.id.initialize({
        client_id: '21202956432-pdk6dbthlbnb9mspamh3cgl03dceeoah.apps.googleusercontent.com',
        callback: (response: any) => this.handleGoogleSignIn(response)
      });
  
      googleAuth.accounts.id.prompt();
    } else {
      console.error('Google API not loaded.');
    }
  }
  
  
  
  handleGoogleSignIn(response: any) {
    const tokenId = response.credential;
    this.accountService.googleLogin(tokenId).subscribe({
      next: (response: any) => {
        this.successMessage = 'Đăng nhập thành công!';
        this.errorMessage = null;
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('accountId', response.accountId.toString());
  
        this.handleUserRole(response.role);
      },
      error: (error) => {
        this.errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      }
    });
  }
}
