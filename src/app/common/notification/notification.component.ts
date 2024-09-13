import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../service/notification.service';
import { NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DataService } from '../../../service/dataservice.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, FormsModule, CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {

  constructor(private notificationService: NotificationService,private dataService: DataService) { }
  accountId: any;
  currentPage = 1; // Trang hiện tại
  itemsPerPage = 5; // Số bản ghi trên mỗi trang
  totalItems = 0; // Tổng số bản ghi
  filteredData: any[] = [];
  selectedNotification: any;
  showModal: boolean = false;
  count: any;

  ngOnInit(): void {
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    if (this.accountId) {
      this.getNotificationById(this.accountId);
    } else {
      console.error('Account ID is not available');
    }
    this.dataService.notify$.subscribe(() => {
      this.getNotificationById(this.accountId);
    });
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
    this.dataService.changeVariable(this.count-1);
  }
}
