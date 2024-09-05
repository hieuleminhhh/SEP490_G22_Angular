import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../../../../service/account.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-authCallback',
  templateUrl: './authCallback.component.html',
  styleUrls: ['./authCallback.component.css'],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class AuthCallbackComponent implements OnInit {

  constructor( private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService) { }

  ngOnInit() {
    this.handleGoogleCallback();
  }
  private handleGoogleCallback(): void {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      
      if (code) {
        console.log(code);
        this.accountService.googleLogin(code).subscribe({
          next: response => {
            localStorage.setItem('token', response.token);
            localStorage.setItem('accountId', response.accountId.toString());
            // Chuyển hướng về trang chính
            window.location.href = 'Home/';
          },
          error: error => {
            console.error('Google login failed', error);
          }
        });
      }
    });
  }
  
}
