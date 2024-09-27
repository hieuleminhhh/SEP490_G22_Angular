import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../../service/account.service';
import { Title } from '@angular/platform-browser';
  import { HttpErrorResponse } from '@angular/common/http';
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


  async signup() { 
      // Clear previous messages
      this.successMessage = null;
      this.errorMessage = null;
  
      // Initialize an array to hold error messages
      const validationErrors: string[] = [];
  
      // Check if passwords match
      if (this.password !== this.confirmPassword) {
          validationErrors.push('Mật khẩu và xác nhận mật khẩu không khớp.');
      }
  
      // Validate required fields
      if (!this.username) {
          validationErrors.push('Vui lòng điền tên đăng nhập.');
      }
      if (!this.email) {
          validationErrors.push('Vui lòng điền email.');
      }
      if (!this.password) {
          validationErrors.push('Vui lòng điền mật khẩu.');
      }
  
      // If there are validation errors, join them and set the error message
      if (validationErrors.length > 0) {
          this.errorMessage = validationErrors.join(' ');
          return; // Early return if there are errors
      }
  
      const registrationData = {
          username: this.username,
          password: this.password,
          confirmPassword: this.confirmPassword,
          email: this.email
      };
  
      try {
          // Step 1: Validate the registration data before sending OTP
          const response = await this.accountService.verifyAccount(registrationData).toPromise();
          
          // Check for response errors here
          if (response.otp) {
              // If the response has an OTP, proceed to send it
              const otpResponse = await this.accountService.sendOtp(this.email).toPromise();
              const generatedOtp = otpResponse.otp; // Capture the OTP from the response
              console.log('OTP sent successfully to:', this.email, 'Generated OTP:', generatedOtp);
  
              // Store information in State Service
              this.accountService.setData({
                  token: this.token,
                  otp: generatedOtp,
                  email: this.email,
                  username: this.username,
                  password: this.password,
                  confirmPassword: this.confirmPassword
              });
  
              // Redirect to OTP Verification page with the email
              this.router.navigate(['/verifyOTPsignin'], { queryParams: { email: this.email } });
          }
      } catch (error: unknown) {
          // Type assertion for better error handling
          const httpError = error as HttpErrorResponse;
  
          // Log and parse the error response only if something fails
          console.error('Error occurred:', httpError);
  
          if (httpError.status === 400 && httpError.error) {
              const errorResponse = httpError.error;
              if (errorResponse.Email) {
                  this.errorMessage = errorResponse.Email;
              } else if (errorResponse.Username) {
                  this.errorMessage = errorResponse.Username;
              } else if (errorResponse.Password) {
                  this.errorMessage = errorResponse.Password;
              } else {
                  this.errorMessage = 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.';
              }
          } else {
              this.errorMessage = 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.';
          }
      }
  }
  
  
}
