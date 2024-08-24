import { Component, OnInit } from '@angular/core';
import { HeaderOrderStaffComponent } from '../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component';
import { SidebarOrderComponent } from "../SidebarOrder/SidebarOrder.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manage-invoice',
  templateUrl: './manage-invoice.component.html',
  styleUrls: ['./manage-invoice.component.css'],
  standalone: true,
  imports: [HeaderOrderStaffComponent, SidebarOrderComponent,FormsModule,CommonModule]
})
export class ManageInvoiceComponent implements OnInit {
  selectedTab: string = 'overview';
  constructor() { }

  ngOnInit() {
    this.selectTab('overview');
  }
  selectTab(tab: string) {
    this.selectedTab = tab;
  }
}
