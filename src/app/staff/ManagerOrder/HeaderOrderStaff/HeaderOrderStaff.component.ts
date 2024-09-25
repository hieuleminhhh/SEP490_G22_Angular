import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../../../service/account.service';
import { SettingService } from '../../../../service/setting.service';
import { NotificationService } from '../../../../service/notification.service';
@Component({
  selector: 'app-HeaderOrderStaff',
  templateUrl: './HeaderOrderStaff.component.html',
  styleUrls: ['./HeaderOrderStaff.component.css'],
  standalone: true,
  imports: [MatToolbarModule, CommonModule, FormsModule, MatButtonModule]
})
export class HeaderOrderStaffComponent implements OnInit {
  accountId: any;
  constructor(private router: Router,
    private route: ActivatedRoute, private accountService: AccountService,
    private settingService: SettingService, private notificationService: NotificationService) { }
  account: any = {};
  dropdownOpen = false;
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  logoUrl: string = '';
  settings: any;

  showNotifications = false;
  notifications: any[] = [];
  itemCountNoti: number = 0;
  private socket!: WebSocket;

  activeTab: string = 'kitchen';
  kitchenNotifications: any[] = [];
  customerNotifications: any[] = []; // Filtered customer notifications
  role:any;

  ngOnInit() {
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    if (this.accountId) {
      this.getAccountDetails(this.accountId);
      this.getNotificationByType(this.accountId);
    } else {
      console.error('Account ID is not available');
    }
    this.getInfo();
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
    };
    this.socket.onmessage = (event) => {
      const reservation = JSON.parse(event.data);
      try {
        this.getNotificationByType(this.accountId);
      } catch (error) {
        console.error('Error parsing reservation data:', error);
      }
    };
    this.socket.onclose = () => {
      console.log('WebSocket connection closed, attempting to reconnect...');
      setTimeout(() => {
        this.initializeWebSocket(); // Hàm khởi tạo WebSocket
      }, 5000); // Thử lại sau 5 giây
    };
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  initializeWebSocket() {
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => { /* xử lý onopen */ };
    this.socket.onmessage = (event) => { /* xử lý onmessage */ };
    this.socket.onclose = () => { /* xử lý onclose */ };
    this.socket.onerror = (error) => { /* xử lý onerror */ };
  }
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  filterNotifications() {
    // Assuming each notification has a 'type' property to distinguish the origin
    this.kitchenNotifications = this.notifications.filter(noti => noti.type === 'kitchen');
    this.customerNotifications = this.notifications.filter(noti => noti.type === 'customer');
  }
  viewDetails() {
    window.location.href = '/notification';
  }
  getNotificationByType(accountId: number): void {
    this.notificationService.getType(accountId).subscribe(
      response => {
        this.role=response;
        this.notificationService.getNotificationByType(response).subscribe(
          response => {
            this.notifications = response.filter((notification: { isView: boolean; }) => notification.isView === false);
            const unseenNotifications = this.notifications.filter(notification => notification.isView === false);
            this.itemCountNoti = unseenNotifications.length;

          },
          error => {
            console.error('Error fetching account details:', error);
          }
        );
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
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
        this.logoUrl = this.settings[0].logo;
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
}
