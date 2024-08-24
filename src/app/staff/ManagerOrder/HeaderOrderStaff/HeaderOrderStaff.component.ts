import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../../../service/account.service';
import { SettingService } from '../../../../service/setting.service';
@Component({
  selector: 'app-HeaderOrderStaff',
  templateUrl: './HeaderOrderStaff.component.html',
  styleUrls: ['./HeaderOrderStaff.component.css'],
  standalone: true,
  imports: [MatToolbarModule, CommonModule, FormsModule, MatButtonModule]
})
export class HeaderOrderStaffComponent implements OnInit {
  accountId: number | null = null;
  constructor(private router: Router,
    private route: ActivatedRoute, private accountService: AccountService, private settingService: SettingService) { }
  account: any = {};
  dropdownOpen = false;
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  logoUrl: string = '';
  settings: any;
  ngOnInit() {
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    if (this.accountId) {
      this.getAccountDetails(this.accountId);
    } else {
      console.error('Account ID is not available');
    }
    this.getInfo();
  }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('accountId');
    this.accountService.logout();
    window.location.href = '/';
  }
  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;
        console.log('Account details:', this.account);
        console.log('Account name:', this.account.username);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
  changeProfile() {
    if (this.accountId) {
      this.accountService.changeProfile(this.accountId, this.account).subscribe({
        next: (updatedAccount) => {
          console.log('Profile updated successfully:', updatedAccount);
          // Reload the page
          window.location.reload();
        },
        error: (error) => {
          console.error('Error updating profile:', error);
        }
      });
    } else {
      console.error('No account ID provided');
    }
  }
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
  getInfo(): void {
    this.settingService.getInfo().subscribe(
      response => {
        this.settings = response;
        console.log(response);
        this.logoUrl = this.settings[0].logo;
        console.log('URL Logo',this.logoUrl);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
}
