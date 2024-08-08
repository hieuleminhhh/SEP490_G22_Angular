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

  constructor(private cookingService: CookingService, private fb: FormBuilder) { }

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.dateFrom = today;
    this.dateTo = today;
    this.dateNow = today;
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


  private updateLocal(orderDetailId:number,dishesServed: number,itemNameOrComboName:string): void {
    let completedDishes = JSON.parse(localStorage.getItem('completedDishes') || '[]');
    completedDishes.push({orderDetailId,dishesServed, itemNameOrComboName });
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
      console.log('111111');

    });

    console.log('Loaded Completed Dishes:', completedDishes);

    this.filterOrders();
  }

  private filterOrders(): void {
    this.filteredOrders = this.order.filter((order: { quantity: number; }) => order.quantity > 0);
  }
  updateDishesServed(orderDetailId: number, dishesServed:number) {
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
}
