import { CookingService } from './../../../service/cooking.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fill-dish',
  standalone: true,
  templateUrl: './fill-dish.component.html',
  styleUrls: ['./fill-dish.component.css'],
  imports: [CommonModule, FormsModule]
})
export class FillDishComponent implements OnInit {

  filteredOrders: any[] = [];
  selectedOrder: any = null;
  orderDish: any;
  number: any;
  selectedButton: 'dineIn' | 'takeAway' = 'dineIn';

  constructor(private cookingService: CookingService) { }

  ngOnInit(): void {
    this.getCompletedDishesFromLocalStorage();
  }

  getCompletedDishesFromLocalStorage(): void {
    const storedCompletedDishes = localStorage.getItem('completedDishes');
    if (storedCompletedDishes) {
      const parsedOrders = JSON.parse(storedCompletedDishes);
      this.filteredOrders = this.groupOrdersByName(parsedOrders);
    } else {
      this.filteredOrders = [];
    }
  }
  groupOrdersByName(orders: any[]): any[] {
    const groupedOrders: { [key: string]: any } = {};

    orders.forEach(order => {
      const name = order.itemNameOrComboName;
      if (!groupedOrders[name]) {
        groupedOrders[name] = { ...order };
      } else {
        groupedOrders[name].dishesServed += order.dishesServed;
      }
    });

    return Object.values(groupedOrders);
  }
  onCheckboxChange(selectedOrder: any, event: any): void {
    if (event.target.checked) {
      // Deselect all other orders
      this.filteredOrders.forEach(order => {
        if (order !== selectedOrder) {
          order.selected = false;
        }
      });
      this.selectedOrder = selectedOrder; // Lưu order được chọn

      this.getOrderDish(selectedOrder.itemNameOrComboName, selectedOrder.dishesServed); // Gọi hàm để lấy dữ liệu của order
    } else {
      this.selectedOrder = null;
      this.orderDish = null;
    }
  }
  getOrderDish(key: string, dishesServed: number) {
    this.cookingService.getOrdersDish(key).subscribe(
      response => {
        this.orderDish = response;
        this.orderDish.forEach((dish: { quantityRequired: number; number: number; }) => {
          if (dish.quantityRequired >= dishesServed) {
            this.number = dishesServed;
          } else {
            this.number = dish.quantityRequired;
          }
        });
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  getOrderTimeHoursMinutes(orderTime: string): string {
    const date = new Date(orderTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  preventNonNumericalInput(event: KeyboardEvent) {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }
  validateInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const sanitizedValue = inputElement.value.replace(/[^0-9]/g, '');
    inputElement.value = sanitizedValue;
  }
  updateDishesServed(orderDetailId: number, itemNameOrComboName: string) {
    const request = {
      orderDetailId: orderDetailId,
      dishesServed: this.number
    };
    this.cookingService.updateDishesServed(request).subscribe(
      response => {
        console.log(response);
        console.log(itemNameOrComboName);
        this.deleteLocalStorageItemsByName(itemNameOrComboName);
        const a = this.getDishesServedByName(itemNameOrComboName) - this.number;
        if (a > 0) {
          this.updateLocal(a, itemNameOrComboName);
        }

        window.location.reload();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  getDishesServedByName(itemNameOrComboName: string): number {
    const order = this.filteredOrders.find(order => order.itemNameOrComboName === itemNameOrComboName);
    return order ? order.dishesServed : 0;
  }

  deleteLocalStorageItemsByName(name: string): void {
    const allKeys = Object.keys(localStorage);
    let isDeleted = false;

    for (const key of allKeys) {
      const value = localStorage.getItem(key);

      if (value) {
        const items = JSON.parse(value);
        if (Array.isArray(items)) {
          const updatedItems = items.filter((item: any) => !item.itemNameOrComboName.includes(name));
          if (updatedItems.length !== items.length) {
            isDeleted = true;
            localStorage.setItem(key, JSON.stringify(updatedItems));
          }
        }
      }
    }

    if (isDeleted) {
      console.log(`Deleted items with name containing '${name}'`);
    } else {
      console.log(`No items found with name containing '${name}'`);
    }

    // In lại các mục sau khi xóa
    console.log('Remaining items in localStorage:', Object.keys(localStorage).map(key => ({ key, value: localStorage.getItem(key) })));
  }

  private updateLocal(dishesServed: number, itemNameOrComboName: string): void {
    let completedDishes = JSON.parse(localStorage.getItem('completedDishes') || '[]');
    completedDishes.push({ dishesServed, itemNameOrComboName });
    localStorage.setItem('completedDishes', JSON.stringify(completedDishes));

    console.log('Completed Dishes:', localStorage.getItem('completedDishes'));
  }

  onButtonClick(buttonType: 'dineIn' | 'takeAway'): void {
    this.selectedButton = buttonType;
  }

  isSelected(buttonType: 'dineIn' | 'takeAway'): boolean {
    return this.selectedButton === buttonType;
  }

}
