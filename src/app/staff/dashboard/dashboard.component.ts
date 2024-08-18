import { Component, OnInit } from '@angular/core';
import { AccountService } from '../../../service/account.service';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
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
    this.accountService.logout();
    this.router.navigate(['/']);
  }
}
