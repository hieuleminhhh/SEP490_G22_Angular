import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../service/cart.service';
import { AccountService } from '../../../service/account.service';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf,FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  itemCount: number = 0;
  accountId: number | null = null;
  account: any = {};
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  constructor(private cartService: CartService, private accountService: AccountService) { }

  ngOnInit(): void {
    this.cartService.getItemCount().subscribe(count => {
      this.itemCount = count;
    });
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    if (this.accountId) {
      this.getAccountDetails(this.accountId);
    } else {
      console.error('Account ID is not available');
    }
  }
  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  dropdownOpen = false;
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('accountId');
    this.accountService.logout();
    window.location.href = '/';
  }
  errorMessage: string = '';
  successMessage: string = '';
  changePassword() {
    if (this.accountId && this.newPassword && this.confirmPassword && this.currentPassword) {
      if (this.newPassword !== this.confirmPassword) {
        this.errorMessage = 'New password and confirmation do not match';
        this.successMessage = ''; // Clear success message
        return;
      }
      const passwordData = {
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword
      };
      this.accountService.changePassword(this.accountId, passwordData).subscribe({
        next: (response) => {
          console.log('Password changed successfully:', response);
          this.successMessage = 'Đổi mật khẩu thành công';
          this.errorMessage = ''; // Clear error message on success

          // Display success message for 3 seconds before reloading
          setTimeout(() => {
            window.location.reload();
          }, 2000); // 3000 milliseconds = 3 seconds

          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.dropdownOpen = false;  // Close dropdown after password change
        },
        error: (error) => {
          this.errorMessage = 'Đổi mật khẩu không thành công xem lại thông tin nhập'; // Set error message on failure
          this.successMessage = ''; // Clear success message
        }
      });
    } else {
      this.errorMessage = 'Đổi mật khẩu không thành công xem lại thông tin nhập'; // Set error message for missing fields
      this.successMessage = ''; // Clear success message
    }
  }
}
