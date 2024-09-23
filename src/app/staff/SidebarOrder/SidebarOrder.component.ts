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
  isMenuCollapsedOrderStaff: boolean = false;
  isMenuCollapsedCashier: boolean = false;
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
  toggleOrderMenuOrderStaff() {
    this.isMenuCollapsedOrderStaff = !this.isMenuCollapsedOrderStaff; // Toggle the order menu
  }
  toggleOrderMenuCashier() {
    this.isMenuCollapsedCashier = !this.isMenuCollapsedCashier; // Toggle the order menu
  }
  openOrderMenuOrderStaff() {
    this.isMenuCollapsedOrderStaff = true; // Ensure the order menu is open
  }
  openOrderMenuCashier() {
    this.isMenuCollapsedCashier = true; // Ensure the order menu is open
  }

  isOrderMenuActiveOrderStaff(): boolean {
    const currentUrl = this.router.url;
    return this.isMenuCollapsedOrderStaff || // Kiểm tra trạng thái của menu
           currentUrl.includes('/listTable') ||
           currentUrl.includes('/createTakeaway') ||
           currentUrl.includes('/createOnline')
  }
  isOrderMenuActiveOrderCashier(): boolean {
    const currentUrl = this.router.url;
    return this.isMenuCollapsedCashier || // Kiểm tra trạng thái của menu
           currentUrl.includes('/listTable') ||
           currentUrl.includes('/createTakeaway') ||
           currentUrl.includes('/createOnline') || 
           currentUrl.includes('/refund') ||
           currentUrl.includes('/delivery') ||
           currentUrl.includes('/managerorder')
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
  tableManagementMenuActive: boolean = false;
  toggleTableManagementMenu() {
    this.tableManagementMenuActive = !this.tableManagementMenuActive;
  }

  isTableManagementMenuActive() {
    return this.tableManagementMenuActive;
  }

  
}
