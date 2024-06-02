import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../../service/account.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(private accountService: AccountService,  private router: Router) { }
  logout() {
    this.accountService.logout();
    this.router.navigate(['/']);
  }
  ngOnInit() {
  }
}
