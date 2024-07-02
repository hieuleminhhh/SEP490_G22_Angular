import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerDishService } from '../../../../service/managerdish.service';
import { ListAllDishes } from '../../../../models/dish.model';
import { ManagerComboService } from '../../../../service/managercombo.service';
import { ListAllCombo } from '../../../../models/combo.model';
import { AddNewOrder } from '../../../../models/order.model';
import { AddOrderDetail } from '../../../../models/orderDetail.model';
import { ManagerOrderService } from '../../../../service/managerorder.service';
import { Address } from '../../../../models/address.model';
@Component({
  selector: 'app-CreateUpdateOrder',
  templateUrl: './CreateUpdateOrder.component.html',
  styleUrls: ['./CreateUpdateOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule]
})
export class CreateUpdateOrderComponent implements OnInit {

  constructor(private router: Router, private dishService: ManagerDishService, private comboService: ManagerComboService, private orderService : ManagerOrderService) { }
  dishes: ListAllDishes[] = [];
  combo: ListAllCombo[] = [];
  addresses: Address[] = []; 
  filteredAddresses: any[] = []; 
  totalPagesArray: number[] = [];
  selectedItems: any[] = [];
  currentPage: number = 1;
  pageSize: number = 5;
  totalCount: number = 0;
  showingDishes: boolean = true;
  showingCombos: boolean = false;
  successMessage: string = '';
  searchTerm: string = '';
  selectedAddress = '';
  showDropdown: boolean = false;
  addNew: AddNewOrder = {
    guestPhone: '',
    email: '',
    addressId: null,
    guestAddress: '',
    consigneeName: '',
    orderDate: new Date(),
    status: 0,
    recevingOrder: null,
    totalAmount: 0,
    deposits: 0,
    note: '',
    type: 4,
    orderDetails: []
  };
  
  ngOnInit() {
    this.loadListDishes();
    this.loadListCombo();
    this.loadAddresses();
    this.selectedAddress = "Khách lẻ"
  }
  loadListDishes(search: string = ''): void {
    console.log('Loading dishes with search term:', search); 
    this.dishService.ListDishes(this.currentPage, this.pageSize, search).subscribe(
      (response: ListAllDishes) => {
        if (response && response.items) {
          this.dishes = [response];
          this.totalCount = response.totalCount;
          console.log('Fetched dishes:', this.dishes);
        } else {
          console.error('Invalid response:', response);
        }
      },
      (error) => {
        console.error('Error fetching dishes:', error);
      }
    );
  }
  loadListCombo(search: string = ''): void {
    console.log('Loading combos with search term:', search);
    this.comboService.ListCombo(this.currentPage, this.pageSize, search).subscribe(
      (response) => {
        if (response && response.items) {
          this.combo = [response];
          this.totalCount = response.totalCount;
          console.log('Fetched combos:', this.combo);
        } else {
          console.error('Invalid response:', response);
        }
      },
      (error) => {
        console.error('Error fetching combos:', error);
      }
    );
  }
  showDishes() {
    this.showingDishes = true;
    this.showingCombos = false;
  }

  showCombos() {
    this.showingDishes = false;
    this.showingCombos = true;
  }
  addItem(item: any) {
    // Find if the item already exists in selectedItems
    const index = this.selectedItems.findIndex(selectedItem => this.itemsAreEqual(selectedItem, item));
  
    if (index !== -1) {
      // If the item already exists, increase its quantity and update the total price
      this.selectedItems[index].quantity++;
      this.selectedItems[index].totalPrice = this.selectedItems[index].quantity * this.selectedItems[index].unitPrice;
    } else {
      // If the item does not exist, add it to selectedItems with quantity 1 and set the total price
      // Use discountedPrice if available, otherwise fallback to price
      const unitPrice = item.discountedPrice ? item.discountedPrice : item.price;
      this.selectedItems.push({ ...item, quantity: 1, unitPrice: unitPrice, totalPrice: unitPrice });
    }

    // Recalculate totalAmount after adding item
    this.calculateTotalAmount();
  }
  
  
  itemsAreEqual(item1: any, item2: any): boolean {
    if (item1.hasOwnProperty('itemName') && item2.hasOwnProperty('itemName')) {
      return item1.itemName === item2.itemName;
    }
    
    if (item1.hasOwnProperty('nameCombo') && item2.hasOwnProperty('nameCombo')) {
      return item1.nameCombo === item2.nameCombo;
    }
    return false;
  }
  removeItem(index: number) {
    this.selectedItems.splice(index, 1);
  }
  createOrder() {
    const orderDetails: AddOrderDetail[] = this.selectedItems.map(item => ({
      itemId: item.id,
      quantity: item.quantity,
      price: item.price,
      unitPrice: item.totalPrice,
      dishId: item.dishId, 
      comboId: item.comboId
    }));

    this.addNew.totalAmount = this.calculateTotalAmount();
    this.addNew.addressId = null;
    this.addNew.orderDetails = orderDetails;
    this.addNew.recevingOrder = null;
    this.addNew.orderDate = this.getVietnamTime();

    this.orderService.AddNewOrder(this.addNew).subscribe(
      response => {
        console.log('Order created successfully:', response);
        this.successMessage = 'Đơn hàng đã được tạo thành công!';
        this.selectedItems = []; 
        setTimeout(() => this.successMessage = '', 5000); // Hide message after 3 seconds
      },
      error => {
        console.error('Error creating order:', error);
      }
    );
}

  getVietnamTime(): Date {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000;
    const vietnamOffset = 7 * 3600000;
    return new Date(now.getTime() + utcOffset + vietnamOffset);
  }

  calculateTotalAmount(): number {
   return this.selectedItems.reduce((total, item) => total + item.totalPrice, 0);
  }
  updateQuantity(index: number, newQuantity: number) {
    if (newQuantity >= 1 && newQuantity <= 100) {
      this.selectedItems[index].quantity = newQuantity;
      this.selectedItems[index].totalPrice = this.selectedItems[index].quantity * this.selectedItems[index].unitPrice;
    }
  }
  
  validateQuantity(index: number) {
    const item = this.selectedItems[index];
    if (item.quantity < 1) {
      item.quantity = 1;
    } else if (item.quantity > 100) {
      item.quantity = 100;
    }
    this.updateQuantity(index, item.quantity);
  }
  loadAddresses() {
    this.orderService.ListAddress().subscribe(
      (response: Address[]) => {
        this.addresses = response;
        this.filteredAddresses = response; // Initialize filteredAddresses
        console.log('Fetched addresses:', this.addresses);
      },
      (error) => {
        console.error('Error fetching addresses:', error);
      }
    );
  }

  toggleDropdown() {
    if (!this.selectedAddress) {
      this.selectedAddress = "Khách lẻ";
    }
    this.showDropdown = !this.showDropdown;
    this.searchTerm = '';
  }

  clearSearchTerm() {
    this.searchTerm = ''; 
  }

  filterAddresses() {
    const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
    this.filteredAddresses = this.addresses.filter(address => 
      address.consigneeName.toLowerCase().includes(lowerCaseSearchTerm) || 
      address.guestPhone.includes(this.searchTerm)
    );
  }

  selectAddress(address: Address) {
    this.selectedAddress = `${address.consigneeName} - ${address.guestPhone}`;
    this.showDropdown = false;
    this.clearSearchTerm(); 
  }

  selectKhachLe() {
    this.selectedAddress = 'Khách lẻ';
    this.showDropdown = false;
    this.clearSearchTerm(); 
  }
}
