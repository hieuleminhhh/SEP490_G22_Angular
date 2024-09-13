import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../service/cart.service';
import { AccountService } from '../../../service/account.service';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../service/notification.service';
import { DataService } from '../../../service/dataservice.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf,FormsModule,CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  itemCount: number = 0;
  accountId: any;
  account: any = {};
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  showNotifications = false;
  notifications: any[] = [];
  itemCountNoti:number=0;

  constructor(private cartService: CartService,private dataService: DataService, private accountService: AccountService, private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.cartService.getItemCount().subscribe(count => {
      this.itemCount = count;
    });
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    if (this.accountId) {
      this.getAccountDetails(this.accountId);
      this.getNotificationById(this.accountId);
    } else {
      console.error('Account ID is not available');
    }
    this.dataService.currentVariable.subscribe((newValue) => {
      this.itemCountNoti = newValue;
    });
    this.dataService.notify$.subscribe(() => {
      this.getNotificationById(this.accountId);
    });
  }
  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;
        this.currentPassword = response.password;
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  getNotificationById(accountId: number): void {
    this.notificationService.getNotificationById(accountId).subscribe(
      response => {
        this.notifications = response.filter((notification: { isView: boolean; }) => notification.isView === false);
        const unseenNotifications = this.notifications.filter(notification => notification.isView === false);
        this.itemCountNoti = unseenNotifications.length;
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
  isChangingPassword: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  cupass: string = '';
  changePassword() {
    // Check if new password matches confirm password
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Mật khẩu không khớp, vui lòng kiểm tra lại.';
      this.successMessage = ''; // Clear success message
      return;
    }

    // Prepare password data for the API call
    const passwordData = {
      currentPassword: this.cupass, // Use cupass if currentPassword is null
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    // Call the API to change password
    this.accountService.changePassword(this.accountId ?? 0, passwordData)
  .subscribe({
      next: (response) => {
        console.log('Password changed successfully:', response);
        this.successMessage = 'Đổi mật khẩu thành công.';
        this.errorMessage = ''; // Clear error message on success

        // Display success message for 3 seconds before reloading
        setTimeout(() => {
          window.location.reload();
        }, 2000);

        // Reset form fields
        this.newPassword = '';
        this.confirmPassword = '';
        this.dropdownOpen = false; // Close dropdown after password change
      },
      error: (error) => {
        console.error('Password change failed:', error);
        this.errorMessage = 'Đổi mật khẩu không thành công, vui lòng kiểm tra thông tin.';
        this.successMessage = ''; // Clear success message
      }
    });
  }


  viewOrder() {
    window.location.href = '/purchase';
  }
  viewDetails(){
    window.location.href = '/notification';
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
  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }


}
