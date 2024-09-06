import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../service/cart.service';
import { AccountService } from '../../../service/account.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  itemCount: number = 0;
  accountId: number | null = null;
  account: any = {};
  constructor(private cartService: CartService, private accountService: AccountService) { }

  ngOnInit(): void {
    this.cartService.getItemCount().subscribe(count => {
      this.itemCount = count;
    });
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    if (this.accountId) {
      this.getAccountDetails(this.accountId);
    } else {
      console.error('Account ID is not available');
    }
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
}
