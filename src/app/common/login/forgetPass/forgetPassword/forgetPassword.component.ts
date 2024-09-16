import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../../../service/account.service';

@Component({
  selector: 'app-forgetPassword',
  templateUrl: './forgetPassword.component.html',
  styleUrls: ['./forgetPassword.component.css'],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class ForgetPasswordComponent implements OnInit {

  constructor(private router: Router, private accountService: AccountService) { }
  email: string = '';
  successMessage: string | null = null;
  errorMessage: string | null = null;
  ngOnInit() {
  }
  navigateToLogin() {
    this.router.navigate(['/login']);
  }
  forgetPassword() {
    if (!this.email) {
      this.errorMessage = 'Vui lòng nhập email của bạn.';
      this.successMessage = ''; // Clear previous success message
      return;
    }
  
    this.accountService.forgotPassword(this.email).subscribe(
      response => {
        if (response.success) {
          this.successMessage = 'Mật khẩu mới đã được gửi tới email của bạn.';
          this.errorMessage='' // Display success message
        } else {
          this.errorMessage = 'Email không được tìm thấy, vui lòng thử lại.'
          this.successMessage='' // Display success message
        }
      },
      error => {
        this.errorMessage = 'Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.';
        this.successMessage = ''; // Clear previous success message
      }
    );
  }
  
  
  
}
