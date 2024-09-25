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
  imports: [RouterLink, RouterLinkActive, NgIf, FormsModule, CommonModule],
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
  itemCountNoti: number = 0;
  private socket!: WebSocket;

  constructor(private cartService: CartService, private dataService: DataService,
     private accountService: AccountService, private notificationService: NotificationService) { }

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
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
    };
    this.socket.onmessage = (event) => {
      const reservation = JSON.parse(event.data);
      try {
        this.getNotificationById(this.accountId);
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
  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;
        this.currentPassword = response.password;
      },
      error => {
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
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Mật khẩu không khớp, vui lòng kiểm tra lại.';
      this.successMessage = '';
      return;
    }
    const passwordData = {
      currentPassword: this.cupass,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };
    this.accountService.changePassword(this.accountId ?? 0, passwordData)
      .subscribe({
        next: (response) => {
          this.successMessage = 'Đổi mật khẩu thành công.';
          this.errorMessage = '';
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          this.newPassword = '';
          this.confirmPassword = '';
          this.dropdownOpen = false;
        },
        error: (error) => {
          console.error('Password change failed:', error);
          this.errorMessage = 'Đổi mật khẩu không thành công, vui lòng kiểm tra thông tin.';
          this.successMessage = '';
        }
      });
  }


  viewOrder() {
    window.location.href = '/purchase';
  }
  viewDetails() {
    window.location.href = '/notification';
  }

  changeProfile() {
    if (this.accountId) {
      this.accountService.changeProfile(this.accountId, this.account).subscribe({
        next: (updatedAccount) => {
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
}
