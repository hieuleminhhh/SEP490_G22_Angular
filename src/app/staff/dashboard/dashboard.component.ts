import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../../service/account.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
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
