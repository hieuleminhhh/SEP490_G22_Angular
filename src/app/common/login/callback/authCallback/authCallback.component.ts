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
        this.accountService.googleLogin(code).subscribe(
          token => {
            this.accountService.getGoogleUserProfile(token).subscribe(
              profile => {
                const email = profile.email; 
                this.accountService.registerGoogleAccount(email).subscribe(
                  registerResponse => {
                    console.log('Google account registered:', registerResponse);
  
                    // Store token and profile data in localStorage
                    localStorage.setItem('token', token);
                    localStorage.setItem('accountId', registerResponse.accountId.toString());
  
                    // Handle user roles and navigate accordingly
                    this.handleUserRole(registerResponse.role);
  
                    this.router.navigate(['/']); 
                  },
                  registerError => {
                    console.error('Error registering Google account', registerError);
                  }
                );
              },
              error => {
                console.error('Error fetching user profile', error);
              }
            );
          },
          error => {
            console.error('Error logging in', error);
          }
        );
      } else {
        console.warn('No authorization code found in URL');
      }
    });
  }
  handleUserRole(role: string) {
    switch (role) {
      case 'User':
        window.location.href = '/';
        break;
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
  
}
