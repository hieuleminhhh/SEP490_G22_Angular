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
      },
      error: error => {
        console.error('Login failed', error);
      }
    });
  }
  
  handleUserRole(role: string) {
    switch (role) {
      case 'Chef':
        this.router.navigate(['/cooking']);
        break;
      case 'Cashier':
        this.router.navigate(['/dashboard']);
        break;
      case 'Admin':
        this.router.navigate(['/setting']);
        break;
      case 'Manager':
        this.router.navigate(['/manager']);
        break;
      case 'OrderStaff':
        window.location.href = '/listTable';
        break;
      case 'Ship':
        this.router.navigate(['/ship']);
        break;
      default:
        console.error('Unknown role:', role);
        break;
    }
  }
  

  

  ngOnInit() {
  }  
}
