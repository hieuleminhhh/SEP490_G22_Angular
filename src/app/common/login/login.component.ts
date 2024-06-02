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
          this.router.navigate(['/dashboard']);
        },
        error: error => {
          console.error('Login failed', error);
        }
      });
  }

  logout() {
    this.accountService.logout();
  }

  ngOnInit() {
  }  
}
