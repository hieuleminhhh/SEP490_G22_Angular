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
  isMenuCollapsedOrderStaff2: boolean = false;
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
    if (this.isMenuCollapsedOrderStaff) {
      this.isMenuCollapsedOrderStaffBooking = false; // Close the table management menu when opening the order menu
    }
  }

  toggleTableManagementMenu() {
    this.isMenuCollapsedOrderStaffBooking = !this.isMenuCollapsedOrderStaffBooking; // Toggle the table management menu
    if (this.isMenuCollapsedOrderStaffBooking) {
      this.isMenuCollapsedOrderStaff = false; // Close the order menu when opening the table management menu
    }
  }
  toggleOrderMenuOrderStaff2() {
    this.isMenuCollapsedOrderStaff2 = !this.isMenuCollapsedOrderStaff2; // Toggle the table management menu
    if (this.isMenuCollapsedOrderStaff2) {
      this.isMenuCollapsedCashier = false; // Close the order menu when opening the table management menu
    }
  }

  isOrderMenuActiveOrderStaff(): boolean {
    const currentUrl = this.router.url;
    return this.isMenuCollapsedOrderStaff ||
      currentUrl.includes('/listTable') ||
      currentUrl.includes('/createTakeaway') ||
      currentUrl.includes('/createOnline');
  }
  isOrderMenuActiveOrderStaff2(): boolean {
    const currentUrl = this.router.url;
    return this.isMenuCollapsedOrderStaff2 ||
      currentUrl.includes('/createTakeaway') ||
      currentUrl.includes('/createOnline');
  }

  isOrderMenuActiveOrderStaffBooking(): boolean {
    const currentUrl = this.router.url;
    return this.isMenuCollapsedOrderStaffBooking ||
      currentUrl.includes('/tableManagement?section=table-layout') ||
      currentUrl.includes('/tableManagement?section=booking-request') ||
      currentUrl.includes('/tableManagement?section=booking-schedule') ||
      currentUrl.includes('/tableManagement?section=booking-history');
  }

  toggleOrderMenuCashier() {
    this.isMenuCollapsedCashier = !this.isMenuCollapsedCashier;
    if (this.isMenuCollapsedCashier) {
      this.isMenuCollapsedOrderStaff2 = false; // Close the order menu when opening the table management menu
    } // Toggle the order menu
  }
  openOrderMenuOrderStaff() {
    this.isMenuCollapsedOrderStaff = true; // Ensure the order menu is open
  }
  openOrderMenuCashier() {
    this.isMenuCollapsedCashier = true; 
    // Ensure the order menu is open
  }
  tableManagementMenuActive: boolean = false;

  isMenuCollapsedOrderStaffBooking: boolean = false;

  isTableManagementMenuActive() {
    return this.tableManagementMenuActive;
  }

  isOrderMenuActiveOrderCashier(): boolean {
    const currentUrl = this.router.url;
    return this.isMenuCollapsedCashier || 
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

}
