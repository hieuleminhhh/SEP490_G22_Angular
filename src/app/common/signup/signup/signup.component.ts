import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SignupComponent implements OnInit {

  constructor(private router: Router) { }
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  successMessage: string | null = null;
  errorMessage: string | null = null;
  passwordError: string | null = null;
  ngOnInit() {
  }
  signup() {
    // Clear previous messages
    this.successMessage = null;
    this.errorMessage = null;
    this.passwordError = null;

    // Check if passwords match
    if (this.password !== this.confirmPassword) {
      this.passwordError = 'Mật khẩu và xác nhận mật khẩu không khớp.';
      return;
    }

    // Simulate sign up process (replace with real service call)
    // For now, we just simulate success after checking passwords
    if (this.username && this.email && this.password) {
      // Simulating successful signup
      this.successMessage = 'Đăng ký thành công!';
      // After 2 seconds, redirect to login page
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } else {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin.';
    }
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
}
