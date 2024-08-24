import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // Import RouterModule
import { Router } from '@angular/router';
import feather from 'feather-icons';
@Component({
  selector: 'app-SidebarOrder',
  templateUrl: './SidebarOrder.component.html',
  styleUrls: ['./SidebarOrder.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class SidebarOrderComponent implements OnInit {
  isMenuCollapsed: boolean = false;
  constructor(private router: Router) { }

  ngOnInit() {
  }
  ngAfterViewInit() {
    feather.replace();
  }
  toggleOrderMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed; // Thay đổi trạng thái của menu
  }

  isOrderMenuActive(): boolean {
    const currentUrl = this.router.url;
    return this.isMenuCollapsed || // Kiểm tra trạng thái của menu
           currentUrl.includes('/listTable') ||
           currentUrl.includes('/createTakeaway') ||
           currentUrl.includes('/createOnline');
  }
}
