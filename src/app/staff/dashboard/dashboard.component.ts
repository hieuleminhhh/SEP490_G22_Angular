import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../../service/account.service';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarOrderComponent } from "../SidebarOrder/SidebarOrder.component";
import { HeaderOrderStaffComponent } from "../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SidebarOrderComponent, HeaderOrderStaffComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  accountId: number | undefined;
  constructor(private accountService: AccountService,  private router: Router,
    private route: ActivatedRoute) { }

    ngOnInit() {
      this.accountId = +(this.route.snapshot.paramMap.get('id')?.toString() ?? '0');
      console.log('Account ID:', this.accountId);
    }
    
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('accountId');
      this.accountService.logout();
      window.location.href = '/';
    }
}
