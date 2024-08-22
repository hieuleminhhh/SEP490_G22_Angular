import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';// Đảm bảo bạn có một dịch vụ auth để lấy thông tin người dùng
import { AuthService } from '../../../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.authService.getUser(); // Lấy thông tin người dùng từ dịch vụ auth
    if (user && user.role === 'OrderStaff') { // Kiểm tra vai trò của người dùng
      return true; 
    } else {
      this.router.navigate(['/login']); // Điều hướng đến trang đăng nhập nếu không có quyền
      return false; // Không cho phép truy cập
    }
  }
}
