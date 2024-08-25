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
    if (this.accountId != null) {
      this.getAccountDetails(this.accountId);
    } else {
    }

  }
  title = 'ManageRestaurant';
  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;;
        this.showHeader = !['OrderStaff', 'Cashier', 'Ship', 'Manager', 'Admin', 'Chef'].includes(this.account.role);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
}
