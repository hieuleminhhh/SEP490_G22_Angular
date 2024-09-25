import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../../service/account.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SignupComponent implements OnInit {

  constructor(private router: Router, private accountService: AccountService, private titleService: Title) { }
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  successMessage: string | null = null;
  errorMessage: string | null = null;
  passwordError: string | null = null;
  ngOnInit() {
    this.titleService.setTitle('Đăng ký | Eating House');
  }

  loginWithGoogle() {
    const clientId = '21202956432-pdk6dbthlbnb9mspamh3cgl03dceeoah.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:4200/auth/callback';
    const scope = 'profile email';
    const responseType = 'code';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  
    window.location.href = authUrl;
  }
  navigateToRegister() {
    this.router.navigate(['/signup']); 
  }
  token: string = '';
  signup() {
    // Clear previous messages
    this.successMessage = null;
    this.errorMessage = null;
  
    // Check if passwords match
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Mật khẩu và xác nhận mật khẩu không khớp.';
      return;
    }
  
    // Validate required fields
    if (this.username && this.email && this.password) {
      const registrationData = {
        username: this.username,
        password: this.password,
        confirmPassword: this.confirmPassword,
        email: this.email
      };
  
      this.accountService.verifyAccount(registrationData).subscribe(
        response => {
          if (response.otp) {

            // Lưu trữ thông tin vào State Service
            this.accountService.setData({
              token: this.token,
              otp: response.otp,
              email: this.email,
              username: this.username,
              password: this.password,
              confirmPassword: this.confirmPassword
            });
      
            // Điều hướng đến trang OTP Verification
            this.router.navigate(['/verifyOTPsignin']);
          }
        },
        error => {
          // Log and parse the error response
          console.error('Registration error:', error);
  
          if (error.status === 400 && error.error) {
            const errorResponse = error.error;
            if (errorResponse.Email) {
              this.errorMessage = errorResponse.Email;
            } else if (errorResponse.Username) {
              this.errorMessage = errorResponse.Username;
            } else if (errorResponse.Password) {
              this.errorMessage = errorResponse.Password;
            }
            else {
              this.errorMessage = 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.';
            }
          } else {
            this.errorMessage = 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.';
          }
        }
      );
    } else {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin.';
    }
  }
  
  
}
