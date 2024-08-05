import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CookingService } from '../../../service/cooking.service';

@Component({
  selector: 'app-cooking-management',
  standalone: true,
  templateUrl: './cooking-management.component.html',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  styleUrls: ['./cooking-management.component.css']
})
export class CookingManagementComponent implements OnInit {

  currentView: string = 'order-layout';
  dateFrom: string = '';
  dateTo: string = '';
  dateNow: string = '';
  order: any;
  filteredOrders: any[] = [];
  forms: { [key: number]: FormGroup } = {};

  constructor(private cookingService: CookingService, private fb: FormBuilder) {

  }

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.dateFrom = today;
    this.dateTo = today;
    this.dateNow = today;
    this.getOrders('1-4');
    this.loadCompletedDishes();
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
        this.order = response.data || [];
        console.log(this.order);
        this.order.forEach((o: { orderDetailId: number; quantity: number; dishesServed: number }) => {
          o.dishesServed = o.dishesServed || 0; // Đặt giá trị mặc định nếu không có
          this.initializeForm(o.orderDetailId, o.quantity);  // Khởi tạo FormGroup cho từng order
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
  getOrder(type: string): void {
    this.cookingService.getOrders(type).subscribe(
      response => {
        this.order = response.data || [];
        console.log(this.order);

        this.order.forEach((o: { orderDetailId: number; quantity: number; dishesServed: number }) => {
          o.dishesServed = o.dishesServed || 0; // Đặt giá trị mặc định nếu không có
          this.initializeForm(o.orderDetailId, o.quantity);  // Khởi tạo FormGroup cho từng order
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
  initializeForm(orderDetailId: number, orderQuantity: number): void {
    this.forms[orderDetailId] = this.fb.group({
      dishesServed: [0, [  // Giá trị mặc định
        Validators.required,
        Validators.min(1),
        Validators.max(orderQuantity)  // Sử dụng giá trị từ order
      ]]
    });
  }

  filterOrdersByDate(): void {
    if (this.dateFrom && this.dateTo) {
      const fromDate = new Date(`${this.dateFrom}T00:00:00Z`);
      const toDate = new Date(`${this.dateTo}T23:59:59Z`);
      this.filteredOrders = this.order.filter((order: { recevingOrder: string | Date }) => {
        const orderDate = new Date(order.recevingOrder);
        return orderDate >= fromDate && orderDate <= toDate;
      });
      console.log(this.filteredOrders);
    } else {
      this.filteredOrders = this.order;
    }
  }

  completeDish(orderDetailId: number): void {
    const form = this.forms[orderDetailId];

    if (form.invalid) {
      alert('Số lượng nhập vào không hợp lệ!');
      return;
    }

    // Lấy giá trị từ form
    const dishesServed = form.value.dishesServed;

    // Lưu món ăn đã hoàn thành vào session
    this.updateSession(orderDetailId, dishesServed);

    // Cập nhật lại số lượng món ăn trong danh sách
    this.updateOrderQuantity(orderDetailId, dishesServed);
  }

  private updateSession(orderDetailId: number, dishesServed: number): void {
    // Lưu thông tin món ăn đã hoàn thành vào localStorage
    let completedDishes = JSON.parse(localStorage.getItem('completedDishes') || '[]');
    completedDishes.push({ orderDetailId, dishesServed });
    localStorage.setItem('completedDishes', JSON.stringify(completedDishes));
  }

  private updateOrderQuantity(orderDetailId: number, dishesServed: number): void {
    // Cập nhật số lượng món ăn trong danh sách orders
    const orderIndex = this.order.findIndex((o: { orderDetailId: number }) => o.orderDetailId === orderDetailId);
    if (orderIndex !== -1) {
      this.order[orderIndex].quantity -= dishesServed;
      this.filteredOrders = [...this.order]; // Cập nhật filteredOrders nếu cần
    }
  }
  private loadCompletedDishes(): void {
    let completedDishes = JSON.parse(localStorage.getItem('completedDishes') || '[]');
    completedDishes.forEach((dish: { orderDetailId: number; dishesServed: number }) => {
      this.updateOrderQuantity(dish.orderDetailId, dish.dishesServed);
    });
  }
}
