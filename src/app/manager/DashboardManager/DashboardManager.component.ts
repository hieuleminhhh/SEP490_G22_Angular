import { Component, OnInit } from '@angular/core';
import { SideBarComponent } from '../SideBar/SideBar.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-DashboardManager',
  templateUrl: './DashboardManager.component.html',
  styleUrls: ['./DashboardManager.component.css'],
  standalone: true,
  imports: [SideBarComponent,RouterModule] 
})
export class DashboardManagerComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}