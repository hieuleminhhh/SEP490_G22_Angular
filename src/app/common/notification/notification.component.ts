import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../service/notification.service';
import { NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DataService } from '../../../service/dataservice.service';
import { Location } from '@angular/common';
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, FormsModule, CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {

  constructor(private notificationService: NotificationService, private dataService: DataService,private location: Location) { }
  accountId: any;
  currentPage = 1; // Trang hiện tại
  itemsPerPage = 5; // Số bản ghi trên mỗi trang
  totalItems = 0; // Tổng số bản ghi
  filteredData: any[] = [];
  selectedNotification: any;
  showModal: boolean = false;
  count: any;
  private socket!: WebSocket;
  private reservationQueue: any[] = [];

  ngOnInit(): void {
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    if (this.accountId) {
      this.getNotificationById(this.accountId);
    } else {
      console.error('Account ID is not available');
    }
    this.dataService.notify$.subscribe((id: number | null) => {
      if (id) { // Kiểm tra id có khác null không
        console.log('Received accountId from Component A:', id); // Debug log
        this.getNotificationById(id); // Gọi lại getNotificationById với accountId nhận được
      }
    });
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
      while (this.reservationQueue.length > 0) {
        this.socket.send(this.reservationQueue.shift());
      }
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
  goBack() {
    this.location.back();
  }
  getNotificationById(accountId: number): void {
    this.notificationService.getNotificationById(accountId).subscribe(
      response => {
        this.filteredData = response;
        this.count = response.filter((notification: { isView: any; }) => !notification.isView).length;
        console.log(response);
        this.totalItems = response.length;
        this.paginateData();
      },
      error => {
        this.getNotificationByType(accountId);
      }
    );
  }
  getNotificationByType(accountId: number): void {
    this.notificationService.getType(accountId).subscribe(
      response => {
        this.notificationService.getNotificationByType(response).subscribe(
          response => {
            this.filteredData = response;
            this.count = response.filter((notification: { isView: any; }) => !notification.isView).length;
            console.log(response);
            this.totalItems = response.length;
            this.paginateData();
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
  updateIsView(notiId: number): void {
    this.notificationService.updateIsView(notiId).subscribe(
      response => {
        console.log(response);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.getNotificationById(this.accountId);
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.getNotificationById(this.accountId);
    }
  }

  paginateData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    if (this.filteredData) {
      this.filteredData = this.filteredData.slice(startIndex, endIndex);
    }
  }
  goToDesiredPage(): void {
    if (this.currentPage >= 1 && this.currentPage <= this.totalPages) {
      this.getNotificationById(this.accountId);
    } else {
      // Xử lý thông báo lỗi nếu số trang nhập không hợp lệ
      console.log('Invalid page number');
    }
  }
  viewDetails(notification: any): void {
    this.selectedNotification = notification;
    this.showModal = true;
    this.updateIsView(notification.notificationId);
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedNotification = [];
    this.getNotificationById(this.accountId);
    this.updateVariable();
  }
  updateVariable() {
    this.dataService.changeVariable(this.count - 1);
  }
  getShortDescription(description: string): string {
    const sentences = description.split('.');
    if (sentences.length > 2) {
      return sentences.slice(0, 2).join('.<br>') + '.';
    }
    return description;
  }
  getFormattedDescription(description: string | undefined): string {
    if (!description) {
      return '';
    }
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let descriptionWithPlaceholders = description.replace(emailRegex, (email) => email.replace(/\./g, '[dot]'));
    const sentences = descriptionWithPlaceholders.split('.').filter(sentence => sentence.trim().length > 0);
    let formattedDescription = sentences.join('.<br><br>') + '.';
    formattedDescription = formattedDescription.replace(/\[dot\]/g, '.');

    return formattedDescription;
  }

}
