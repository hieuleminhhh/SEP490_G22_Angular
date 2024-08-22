// src/app/app.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './common/navbar/navbar.component';
import { FooterComponent } from './common/footer/footer.component';
import { CartService } from '../service/cart.service';
import { AccountService } from '../service/account.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, IonicModule, NavbarComponent,FooterComponent, RouterOutlet],
  providers: [CartService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  
})
export class AppComponent {
  accountId: number | null = null;
  account: any;
  showHeader: boolean = true; 

  constructor(private accountService: AccountService, private router: Router) {

    }
  ngOnInit() {
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    console.log('32',this.accountId);
    if (this.accountId != null) {
      this.getAccountDetails(this.accountId);
    } else {
      console.error('Account ID is not available');
    }
 
  }
  title = 'ManageRestaurant';
  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;;
        console.log('Account details:', this.account);
        console.log('Account role:', this.account.role);
        this.showHeader = !['OrderStaff', 'Cashier', 'Ship', 'Manager', 'Admin', 'Chef'].includes(this.account.role);
        console.log('47',this.showHeader);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
}
