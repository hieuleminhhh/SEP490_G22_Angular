import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarOrderComponent } from '../../SidebarOrder/SidebarOrder.component';
import { ManagerDishService } from '../../../../service/managerdish.service';
import { Address, AddNewAddress } from '../../../../models/address.model';
import { ListAllCombo } from '../../../../models/combo.model';
import { ListAllDishes } from '../../../../models/dish.model';
import { AddNewOrder } from '../../../../models/order.model';
import { AddOrderDetail } from '../../../../models/orderDetail.model';
import { ManagerComboService } from '../../../../service/managercombo.service';
import { ManagerOrderService } from '../../../../service/managerorder.service';
@Component({
  selector: 'app-CreateOnlineOrder',
  templateUrl: './CreateOnlineOrder.component.html',
  styleUrls: ['./CreateOnlineOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent]
})
export class CreateOnlineOrderComponent implements OnInit {

  constructor(private router: Router, private dishService: ManagerDishService, private comboService: ManagerComboService, private orderService : ManagerOrderService) { }
  @ViewChild('formModal') formModal!: ElementRef;
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
  search: string = '';
  selectedCategory: string = '';
  showDropdown: boolean = false;
  receivingDate: string = '';
  receivingTime: string = '';
  timeOptions: string[] = [];
  addNew: AddNewOrder = {
    guestPhone: '',
    email: '',
    addressId: 0,
    guestAddress: '',
    consigneeName: '',
    orderDate: new Date(),
    status: 1,
    recevingOrder: '',
    totalAmount: 0,
    deposits: 0,
    note: '',
    type: 2,
    orderDetails: []
  };
  ngOnInit() {
    this.loadListDishes();
    this.loadListCombo();
    const today = new Date();
    this.receivingDate = today.toISOString().split('T')[0];
    this.generateTimeOptions();
    this.setDefaultReceivingTime();
    this.selectCategory('Món chính');
  }
  selectCategory(searchCategory: string) {
    this.selectedCategory = searchCategory;
    if (searchCategory === 'Combo') {
      this.showingDishes = false;
      this.showingCombos = true;
    } else {
      this.showingDishes = true;
      this.showingCombos = false;
      this.loadListDishes(searchCategory);
    }
  }
  loadListDishes(search: string = '', searchCategory: string =''): void {
    console.log('Loading dishes with search term:', search); 
    this.dishService.ListDishes(this.currentPage,this.pageSize, search, searchCategory ).subscribe(
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
  onSearch() {
    if (this.showingDishes) {
      this.loadListDishes(this.selectedCategory,this.search);
    } else if (this.showingCombos) {
      this.loadListCombo(this.search);
    }
  }
  
  
  showDishes() {
    this.showingDishes = true;
    this.showingCombos = false;
    this.loadListDishes(this.search);
  }

  showCombos() {
    this.showingCombos = !this.showingCombos;
    this.showingDishes = false;
    this.showingCombos = true;
    this.selectedCategory = ''; 
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
  combineDateTime(): void {
    if (this.receivingDate && this.receivingTime) {
        const formattedDateTime = this.formatDateTime(this.receivingDate, this.receivingTime);
        this.addNew.recevingOrder = formattedDateTime;
        console.log(formattedDateTime);
        console.log(this.receivingDate);
        console.log(this.receivingTime);
    }
}

formatDateTime(date: string, time: string): string {
    return `${date}T${time}:00.000Z`;
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
    this.combineDateTime();
    this.addNew.totalAmount = this.calculateTotalAmount();
    this.addNew.orderDetails = orderDetails;
    this.addNew.orderDate = this.getVietnamTime();
    
    console.log('Order Details:', orderDetails);
    this.orderService.AddNewOrder(this.addNew).subscribe(
      response => {
        console.log('Order created successfully:', response);
        this.successMessage = 'Đơn hàng đã được tạo thành công!';
        this.selectedItems = [];
        this.clearForm(); // Clear the form after successful order creation
        this.setDefaultReceivingTime(); // Reset the default receiving time
        setTimeout(() => this.successMessage = '', 5000);
      },
      error => {
        console.error('Error creating order:', error);
      }
    );
  }
generateTimeOptions() {
  const startHour = 9; // 9 AM
  const endHour = 21; // 9 PM
  const interval = 30; // 30 minutes

  this.timeOptions = []; // Clear existing time options before generating new ones

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const hourString = hour < 10 ? '0' + hour : hour.toString();
      const minuteString = minute < 10 ? '0' + minute : minute.toString();
      this.timeOptions.push(`${hourString}:${minuteString}`);
    }
  }

  // After generating time options, set default receiving time again if needed
  this.setDefaultReceivingTime();
}

setDefaultReceivingTime() {
  const now = new Date();
  now.setHours(now.getHours() + 1); // Add one hour to the current time
  now.setMinutes(0); // Round down to the nearest hour

  const defaultHour = now.getHours();
  const defaultMinute = now.getMinutes();

  const defaultHourString = defaultHour < 10 ? '0' + defaultHour : defaultHour.toString();
  const defaultMinuteString = defaultMinute < 10 ? '0' + defaultMinute : defaultMinute.toString();
  const defaultTime = `${defaultHourString}:${defaultMinuteString}`;

  // Find the closest time option and set it as default
  const closestTimeOption = this.timeOptions.find(time => time >= defaultTime) || this.timeOptions[0];
  this.receivingTime = closestTimeOption;
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

  clearForm() {
    this.addNew = {
      consigneeName: '',
      guestPhone: '',
      guestAddress: '',
      email: '',
      addressId: 0,  // Assuming addressId is of type number
      orderDate: null,  // Assuming orderDate is of type Date or null
      status: 0,     // Assuming status is of type number
      recevingOrder: null,  // Assuming recevingOrder is of type boolean or null
      orderDetails: [],  // Assuming orderDetails is of type array
      totalAmount: 0,   // Assuming totalAmount is of type number
      deposits: 0,     // Assuming deposits is of type array or any other type
      note: '',  
      type: 0,       // Assuming note is of type string
      // Add more properties as required by the AddNewOrder type/interface
    };
  }
  

  addErrors: any = {};
  addErrorMessage: string = '';
  clearAddErrors() {
    this.addErrors = {};
  }

  closeModal() {
    const modalElement = this.formModal.nativeElement;
    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    document.body.classList.remove('modal-open');
    const modalBackdrop = document.getElementsByClassName('modal-backdrop')[0];
    if (modalBackdrop && modalBackdrop.parentNode) {
      modalBackdrop.parentNode.removeChild(modalBackdrop);
    }
  }
}
