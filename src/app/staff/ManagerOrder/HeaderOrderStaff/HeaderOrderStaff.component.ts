import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../../../service/account.service';
@Component({
  selector: 'app-HeaderOrderStaff',
  templateUrl: './HeaderOrderStaff.component.html',
  styleUrls: ['./HeaderOrderStaff.component.css'],
  standalone: true,
  imports: [MatToolbarModule, CommonModule, FormsModule, MatButtonModule ]
})
export class HeaderOrderStaffComponent implements OnInit {
  accountId: number | null = null;
  constructor(  private router: Router,
    private route: ActivatedRoute,private accountService: AccountService ) { }
    account: any;
    dropdownOpen = false;
  ngOnInit() {
    const accountIdString = localStorage.getItem('accountId');
      this.accountId = accountIdString ? Number(accountIdString) : null;
      if (this.accountId) {
        this.getAccountDetails(this.accountId);
      } else {
        console.error('Account ID is not available');
      }
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
  changePassword() {
    this.dropdownOpen = false;  // Đóng menu sau khi chọn
  }
  saveProfile() {
    if (this.accountId) {
      this.accountService.updateAccount(this.accountId, this.account).subscribe({
        next: (updatedAccount) => {
          console.log('Profile updated successfully:', updatedAccount);
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
