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
    this.accountService.login(this.username, this.password)
      .subscribe({
        next: response => {
          console.log('Login successful');
          console.log(this.username);
          console.log(this.password);
          console.log(response.token);
          console.log(response.role);
          console.log(response.accountId); // Log the accountId
  
          // Lưu token và vai trò vào localStorage hoặc một dịch vụ để sử dụng sau này
          localStorage.setItem('token', response.token);
          const userRole = response.role; // Vai trò người dùng từ phản hồi
          const accountId = response.accountId; // Lấy accountId từ phản hồi
  
          switch (userRole) {
            case 'Chef':
              this.router.navigate(['/cooking', accountId]);
              break;
            case 'Cashier':
              this.router.navigate(['/dashboard', accountId]);
              break;
            case 'Admin':
              this.router.navigate(['/setting', accountId]);
              break;
            case 'Manager':
              this.router.navigate(['/manager', accountId]);
              break;
            case 'StaffOrder':
              this.router.navigate(['/listTable', accountId]);
              break;
            case 'Ship':
              this.router.navigate(['/ship', accountId]);
              break;
            default:
              console.error('Unknown role:', userRole);
              break;
          }
        },
        error: error => {
          console.error('Login failed', error);
        }
      });
  }
  

  

  ngOnInit() {
  }  
}
