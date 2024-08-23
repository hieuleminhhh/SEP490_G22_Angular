import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CookingService } from '../../../service/cooking.service';
import { HeaderOrderStaffComponent } from "../../staff/ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";

@Component({
  selector: 'app-cooking-management',
  standalone: true,
  templateUrl: './cooking-management.component.html',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderOrderStaffComponent],
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
  selectedItem: any;
  ingredient: any;
  constructor(private cookingService: CookingService, private fb: FormBuilder) { }

  ngOnInit(): void {
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo = this.formatDate(today);
    this.dateNow = this.formatDate(today);
    this.getOrders('Current');
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
          o.dishesServed = o.dishesServed || 0;
          this.initializeForm(o.orderDetailId, o.quantity);
        });
        this.filterOrdersByDate();
        this.loadCompletedDishes();
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
      dishesServed: [0, [
        Validators.required,
        Validators.min(1),
        Validators.max(orderQuantity)
      ]]
    });
  }

  filterOrdersByDate(): void {
    if (this.dateFrom && this.dateTo) {
      const fromDate = new Date(`${this.dateFrom}T00:00:00Z`);
      const toDate = new Date(`${this.dateTo}T23:59:59Z`);
      this.filteredOrders = this.order.filter((order: {
        quantity: number; recevingOrder: string | Date
      }) => {
        const orderDate = new Date(order.recevingOrder);
        return orderDate >= fromDate && orderDate <= toDate && order.quantity > 0;
      });
      console.log(this.filteredOrders);
    } else {
      this.filteredOrders = this.order.filter((order: { quantity: number }) => order.quantity > 0);
    }
  }

  completeDish(orderDetailId: number, itemNameOrComboName: string, type: number): void {
    const form = this.forms[orderDetailId];

    if (form.invalid) {
      alert('Số lượng nhập vào không hợp lệ!');
      return;
    }
    const dishesServed = form.value.dishesServed;

    if (type === 1 || type === 2) {
      this.updateDishesServed(orderDetailId, dishesServed);
    } else {
      this.updateLocal(orderDetailId, dishesServed, itemNameOrComboName);
    }
    this.updateOrderQuantity(orderDetailId, dishesServed);
    this.filterOrders();
    form.reset({ dishesServed: 0 });
  }


  private updateLocal(orderDetailId: number, dishesServed: number, itemNameOrComboName: string): void {
    let completedDishes = JSON.parse(localStorage.getItem('completedDishes') || '[]');
    completedDishes.push({ orderDetailId, dishesServed, itemNameOrComboName });
    localStorage.setItem('completedDishes', JSON.stringify(completedDishes));

    console.log('Completed Dishes:', localStorage.getItem('completedDishes'));
  }

  private updateOrderQuantity(orderDetailId: number, dishesServed: number): void {
    const orderIndex = this.order.findIndex((o: { orderDetailId: number }) => o.orderDetailId === orderDetailId);

    if (orderIndex !== -1) {
      this.order[orderIndex].quantity -= dishesServed;
      if (this.order[orderIndex].quantity < 0) {
        this.order[orderIndex].quantity = 0;
      }
    }
    console.log(this.order);
  }

  private loadCompletedDishes(): void {
    let completedDishes = JSON.parse(localStorage.getItem('completedDishes') || '[]');
    completedDishes.forEach((dish: { orderDetailId: number; dishesServed: number }) => {
      this.updateOrderQuantity(dish.orderDetailId, dish.dishesServed);

    });

    console.log('Loaded Completed Dishes:', completedDishes);

    this.filterOrders();
  }

  private filterOrders(): void {
    this.filteredOrders = this.order.filter((order: { quantity: number; }) => order.quantity > 0);

  }

  updateDishesServed(orderDetailId: number, dishesServed: number) {
    const request = {
      orderDetailId: orderDetailId,
      dishesServed: dishesServed
    };
    this.cookingService.updateDishesServed(request).subscribe(
      response => {

      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  convertOrderType(type: number): string {
    switch (type) {
      case 1:
        return 'Mang về';
      case 2:
        return 'Giao hàng';
      case 3:
        return 'Đặt bàn';
      case 4:
        return 'Tại chỗ';
      default:
        return 'Không xác định';
    }
  }
  addOneHour(dateString: string): string {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 1);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const updatedDateString = `${year}-${month}-${day}T${hours}:${minutes}`;

    return updatedDateString;
  }

  isRecevingOrderCloseToCurrentTime(recevingOrder: string): boolean {
    if (!recevingOrder) return false;

    const currentDate = new Date();
    const recevingOrderDate = new Date(recevingOrder);

    // Tính toán khoảng cách thời gian giữa recevingOrder và thời gian hiện tại
    const timeDifference = Math.abs(currentDate.getTime() - recevingOrderDate.getTime());
    const oneHourInMilliseconds = 60 * 60 * 1000; // 1 giờ = 3600000 milliseconds

    return timeDifference <= oneHourInMilliseconds;
  }

  isRecevingOrderMoreThanOneHourLater(recevingOrder: string, orderTime: string): boolean {
    if (!recevingOrder || !orderTime) return false;

    const recevingOrderDate = new Date(recevingOrder);
    const orderTimeDate = new Date(orderTime);
    const oneHourInMilliseconds = 60 * 60 * 1000; // 1 giờ = 3600000 milliseconds

    // Kiểm tra xem recevingOrder có lớn hơn orderTime ít nhất 1 giờ không
    return recevingOrderDate.getTime() >= (orderTimeDate.getTime() + oneHourInMilliseconds);
  }

  showDetails(order: any) {
    console.log(order);
    this.selectedItem = order;
    this.ingredient = 1;
  }

  closePopup() {
    this.selectedItem = null;
  }

  getIngredient(name: string, quantity:number): void {
    this.cookingService.getOrders(name).subscribe(
      response => {
        this.order = response.data || [];
        console.log(this.order);
        this.order.forEach((o: { orderDetailId: number; quantity: number; dishesServed: number }) => {
          o.dishesServed = o.dishesServed || 0;
          this.initializeForm(o.orderDetailId, o.quantity);
        });
        this.filterOrdersByDate();
        this.loadCompletedDishes();
      },
      error => {
        console.error('Error:', error);
        this.order = [];
        this.filteredOrders = [];
      }
    );
  }



  formatDate(date: Date): string {
    // Hàm chuyển đổi định dạng ngày thành chuỗi "YYYY-MM-DD"
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }







}

