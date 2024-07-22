import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CookingService } from '../../../service/cooking.service';

@Component({
  selector: 'app-cooking-management',
  standalone: true,
  templateUrl: './cooking-management.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./cooking-management.component.css']
})
export class CookingManagementComponent implements OnInit {

  currentView: string = 'order-layout';
  dateFrom: string = '';
  dateTo: string = '';
  order: any;
  filteredOrders: any[] = [];

  constructor(private cookingService: CookingService) { }

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.dateFrom = today;
    this.dateTo = today;
    this.getOrders('1-4');
  }

  setView(view: string) {
    this.currentView = view;
  }
  onDateFromChange(): void {
    if (this.dateTo < this.dateFrom) {
      this.dateTo = this.dateFrom;
    }
    this.filterOrdersByDate();
  }
  onDateToChange(): void {
    this.filterOrdersByDate();
  }
  getOrders(type: string): void {
    this.cookingService.getOrders(type).subscribe(
      response => {
        this.order = response.data || []; // Đảm bảo rằng order luôn là một mảng
        this.order.forEach((o: { dishesServed: number; }) => {
          o.dishesServed = o.dishesServed || 0; // Đặt giá trị mặc định nếu không có
        });
      },
      error => {
        console.error('Error:', error);
        this.order = [];
      }
    );
  }
  getOrder(type: string): void {
    this.cookingService.getOrders(type).subscribe(
      response => {
        this.order = response.data || []; // Đảm bảo rằng order luôn là một mảng
        this.order.forEach((o: { dishesServed: number; }) => {
          o.dishesServed = o.dishesServed || 0; // Đặt giá trị mặc định nếu không có
        });
        this.filterOrdersByDate();
      },
      error => {
        console.error('Error:', error);
        this.order = [];
        this.filteredOrders = [];
      }
    );
  }

  filterOrdersByDate(): void {
    if (this.dateFrom && this.dateTo) {
      const fromDate = new Date(`${this.dateFrom}T00:00:00Z`);
      const toDate = new Date(`${this.dateTo}T23:59:59Z`);
      this.filteredOrders = this.order.filter((order: { recevingOrder: string | Date }) => {
        const orderDate = new Date(order.recevingOrder);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    } else {
      this.filteredOrders = this.order;
    }
  }

  completeOrder(order: any): void {
    // Thực hiện hành động khi nút hoàn thành được nhấn
    console.log('Đơn hàng đã hoàn thành:', order);
    // Ví dụ: gọi service để cập nhật trạng thái đơn hàng
  }
}
