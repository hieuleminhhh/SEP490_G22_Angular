import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../../../../service/account.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-verifyOtpSignup',
  templateUrl: './verifyOtpSignup.component.html',
  styleUrls: ['./verifyOtpSignup.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VerifyOtpSignupComponent implements OnInit {

  constructor(private accountService: AccountService, private router: Router, private route: ActivatedRoute) { }
  token: string | null = null;
  email: string | null = null;
  otp: string | null = null;
  username: string | null = null;
  password: string | null = null;
  confirmPassword: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  otpNhap: string | null = null;
  ngOnInit() {
    const data = this.accountService.getData();
    console.log('Data from service:', data); // In dữ liệu ra console để kiểm tra
    this.token = data.token;
    this.otp = data.otp;
    this.email = data.email;
    this.username = data.username;
    this.password = data.password;
    this.confirmPassword = data.confirmPassword;
  }
  verifyOtp() {
    this.successMessage = null;
    this.errorMessage = null;
  
    console.log('Otp nhập:', this.otpNhap);
    if (this.otp !== this.otpNhap) {
      this.errorMessage = 'Mã OTP không khớp.';
      return;
    }
  
    this.accountService.register({
      email: this.email,
      username: this.username,
      password: this.password,
      confirmPassword: this.confirmPassword
    }).subscribe(
      response => {
        this.successMessage = 'Xác minh thành công!';
        
        // Show the success message for 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error => {
        console.error('OTP verification error:', error);
        setTimeout(() => {
          this.errorMessage = 'Đã xảy ra lỗi khi xác minh OTP. Vui lòng thử lại.';
        }, 2000);
       
      }
    );
  }
}
  
  
  
