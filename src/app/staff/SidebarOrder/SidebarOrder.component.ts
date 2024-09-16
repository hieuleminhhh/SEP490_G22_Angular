import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // Import RouterModule
import { Router } from '@angular/router';
import feather from 'feather-icons';
import { AccountService } from '../../../service/account.service';
@Component({
  selector: 'app-SidebarOrder',
  templateUrl: './SidebarOrder.component.html',
  styleUrls: ['./SidebarOrder.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class SidebarOrderComponent implements OnInit {
  isMenuCollapsed: boolean = false;
  accountId: number | null = null;
  constructor(private router: Router, private accountService: AccountService) { }

  ngOnInit() {
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    if (this.accountId) {
      this.getAccountDetails(this.accountId);
    } else {
      console.error('Account ID is not available');
    }
  }
  ngAfterViewInit() {
    feather.replace();
  }
  toggleOrderMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed; // Thay đổi trạng thái của menu
  }

  isOrderMenuActive(): boolean {
    const currentUrl = this.router.url;
    return this.isMenuCollapsed || // Kiểm tra trạng thái của menu
           currentUrl.includes('/listTable') ||
           currentUrl.includes('/createTakeaway') ||
           currentUrl.includes('/createOnline') ||
           currentUrl.includes('/fillDish');
  }
  account: any;
  showSidebar: boolean = true;
  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;
        console.log('Account details:', this.account);
        console.log('Account role:', this.account.role);
        this.showSidebar = this.account.role !== 'OrderStaff';

      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
}
