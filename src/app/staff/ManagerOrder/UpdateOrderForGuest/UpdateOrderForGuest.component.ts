import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerOrderService } from '../../../../service/managerorder.service';// Import your interface
import { ActivatedRoute } from '@angular/router';
import { SidebarOrderComponent } from "../../SidebarOrder/SidebarOrder.component";
import { AddNewAddress, Address } from '../../../../models/address.model';
import { ListAllCombo } from '../../../../models/combo.model';
import { ListAllDishes } from '../../../../models/dish.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ManagerDishService } from '../../../../service/managerdish.service';
import { ManagerComboService } from '../../../../service/managercombo.service';
import { ManagerOrderDetailService } from '../../../../service/managerorderDetail.service';
import { AddOrderDetail, ListOrderDetailByOrder, OrderDetail } from '../../../../models/orderDetail.model';
import { OrderItem, SelectedItem } from '../../../../models/order.model';
import { InvoiceService } from '../../../../service/invoice.service';
import { CurrencyFormatPipe } from '../../../common/material/currencyFormat/currencyFormat.component';
import { DateFormatPipe } from '../../../common/material/dateFormat/dateFormat.component';
import { ItemInvoice } from '../../../../models/invoice.model';
import { Discount } from '../../../../models/discount.model';
import { PercentagePipe } from '../../../common/material/percentFormat/percentFormat.component';
import { DiscountService } from '../../../../service/discount.service';
@Component({
  selector: 'app-UpdateOrderForGuest',
  templateUrl: './UpdateOrderForGuest.component.html',
  styleUrls: ['./UpdateOrderForGuest.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, CurrencyFormatPipe, DateFormatPipe, PercentagePipe]
})
export class UpdateOrderForGuestComponent implements OnInit {

  constructor(private router: Router, private orderService: ManagerOrderService, private route: ActivatedRoute,  private dishService: ManagerDishService,
    private comboService: ManagerComboService,private orderDetailService: ManagerOrderDetailService, private invoiceService : InvoiceService, private discountService: DiscountService ) { }
 @ViewChild('formModal') formModal!: ElementRef;
 orderId: number = 0;
 tableId: number = 0;
 orders: any[] = []; 
 errorMessage: string = '';
 dishes: ListAllDishes[] = [];
 combo: ListAllCombo[] = [];
 addresses: Address[] = []; 
 filteredAddresses: any[] = [];
 selectedItems: any[] = []; 
 showingDishes: boolean = true;
 showingCombos: boolean = false;
 successMessage: string = '';
 search: string = '';
 searchCategory: string = '';
 showDropdown: boolean = false;
 currentPage: number = 1;
 pageSize: number = 5;
 totalCount: number = 0;
 totalPagesArray: number[] = [];
 receivingTime: any;
 receivingDate: string = '';
 timeOptions: string[] = [];
 searchTerm: string = '';
 selectedAddress: Address | any = {};
 paymentMethod: string = '0';
 selectedOrder: any; 
 selectedDiscount: any | null = null;
 selectedDiscountName: string = '';
 selectedDiscountPercent: number = 0;
 totalAmountAfterDiscount: number = 0;
 totalAmount: number = 0;
 discount: Discount[] = [];
 newAddress: AddNewAddress = {
   guestAddress: 'Ăn tại quán',
   consigneeName: '',
   guestPhone: '',
   email:'antaiquan@gmail.com',
 };
 customerPaid: number | null = null;
 addressId: number | null = null;
 addNew: any = {};
 dbItems: any[] = []; // Added dbItems property
 newlyAddedItems: any[] = [];
 invoice: any = {};
 initialTotalAmount: number = 0;
  ngOnInit() {
    this.loadListDishes();
    this.loadListCombo();
    this.loadAddresses();
    this.selectCategory('Món chính');
    this.route.params.subscribe(params => {
      this.orderId = +params['orderId'];
      this.getOrder(this.orderId);
    });
    this.LoadActiveDiscounts(this.orderId);
    this.calculateAndSetTotalAmount();
    console.log('AAAA'+this.selectedDiscount);
    
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
  selectCategory(category: string) {
    this.searchCategory = category;
    if (category === 'Combo') {
      this.showingDishes = false;
      this.showingCombos = true;
    } else {
      this.showingDishes = true;
      this.showingCombos = false;
      this.loadListDishes(category);
    }
  }
  onSearch() {
    if (this.showingDishes) {
      this.loadListDishes(this.searchCategory,this.search);
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
    this.searchCategory = ''; 
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
      this.addressId = address.addressId;
      this.addNew.guestPhone = address.guestPhone;
      this.addNew.email = 'antaiquan@gmail.com';
      this.addNew.guestAddress = 'Ăn tại quán'; 
      this.addNew.consigneeName = address.consigneeName; 
      this.showDropdown = false;
      console.log('Selected Address:', this.addNew);
  }
    createAddress() {
      this.saveAddress();
  }
  saveAddress() {
    this.orderService.AddNewAddress(this.newAddress).subscribe(
      (response: any) => {
        console.log('Address created successfully:', response); // Debug: Check response here
        this.successMessage = 'Địa chỉ đã được thêm thành công!';
        setTimeout(() => this.successMessage = '', 5000);
  
        // Ensure response contains correct properties in 'data'
        if (response && response.data && response.data.consigneeName && response.data.guestPhone) {
          // Update selectedAddress with the newly created address data
          this.selectedAddress = `${response.data.consigneeName} - ${response.data.guestPhone}`;
        } else {
          console.error('Invalid response format after creating address:', response);
        }
  
        // Reload addresses to update the list
        this.loadAddresses();
  
        // Clear form and close modal
        this.clearForm();
        this.closeModal();
      },
      error => {
        console.error('Error creating address:', error);
        this.clearAddErrors();
  
        // Handle errors from response
        if (error.error) {
          const fieldErrors = error.error;
          if (fieldErrors['consigneeName']) {
            this.addErrors.consigneeNameError = fieldErrors['consigneeName'];
          }
          if (fieldErrors['phone']) {
            this.addErrors.guestPhoneError = fieldErrors['phone'];
          }
          if (fieldErrors['guestAddress']) {
            this.addErrors.guestAddressError = fieldErrors['guestAddress'];
          }
        } else {
          this.addErrorMessage = 'An error occurred. Please try again later.';
        }
      }
    );
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
      this.newAddress = { consigneeName: '', guestPhone: '', guestAddress: '' , email: '' };
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
    
    reloadPage() {
      window.location.reload();
    }
    increaseQuantity(index: number): void {
      const item = this.selectedItems[index];
      if (item) {
        item.quantity++;
        this.updateTotalPrice(index);
        this.addOrUpdateNewlyAddedItem(item);
      }
    }
    
    // Method to decrease item quantity
    decreaseQuantity(index: number): void {
      const item = this.selectedItems[index];
      if (item && item.quantity > 1) {
        item.quantity--;
        this.updateTotalPrice(index);
        this.removeOrUpdateNewlyAddedItem(item);
      }
    }
    
    // Method to add or update newly added item
    async addOrUpdateNewlyAddedItem(item: any): Promise<void> {
      try {
        // Fetch the current quantities from the database
        const currentQuantities = await this.orderService.getQuantityOrderDetails(this.orderId).toPromise();
        console.log("Current Quantities:", currentQuantities);
    
        // Find the current quantity of the specific item
        const currentQuantityObj = currentQuantities.find(
          (qtyObj: any) =>
            (qtyObj.dishId === item.dishId && item.dishId !== null) ||
            (qtyObj.comboId === item.comboId && item.comboId !== null)
        );
    
        const currentQuantity = currentQuantityObj ? currentQuantityObj.quantity : 0;
        console.log("Current Quantity for Item:", currentQuantity);
    
        const newlyAddedIndex = this.newlyAddedItems.findIndex(newlyAddedItem => this.itemsAreEqual(newlyAddedItem, item));
        console.log("Index in newlyAddedItems:", newlyAddedIndex);
        if (newlyAddedIndex !== -1) {
          // Item already exists in newlyAddedItems, update the quantity
          const newQuantity = item.quantity;
          const initialQuantity = currentQuantity; // Assuming currentQuantity is the initial quantity in the database
          this.newlyAddedItems[newlyAddedIndex].quantity = newQuantity - initialQuantity;
          this.newlyAddedItems[newlyAddedIndex].totalPrice = this.newlyAddedItems[newlyAddedIndex].quantity * (this.newlyAddedItems[newlyAddedIndex].discountedPrice || this.newlyAddedItems[newlyAddedIndex].price);
        } 
        else {
          // Item is new, add to newlyAddedItems
          const newItem = {
            ...item,
            quantity: item.quantity - currentQuantity, // Only add the new quantity
            totalPrice: (item.quantity - currentQuantity) * (item.discountedPrice || item.price)
          };
          this.newlyAddedItems.push(newItem);
        }
        console.log('Updated Newly Added Items:', this.newlyAddedItems);
      } catch (error) {
        console.error('Error updating newly added items:', error);
      }
    }
    
    
   async removeOrUpdateNewlyAddedItem(item: any): Promise<void> {
  try {
    // Fetch the current quantities from the database
    const currentQuantities = await this.orderService.getQuantityOrderDetails(this.orderId).toPromise();
    console.log("Current Quantities:", currentQuantities);

    // Find the current quantity of the specific item
    const currentQuantityObj = currentQuantities.find(
      (qtyObj: any) =>
        (qtyObj.dishId === item.dishId && item.dishId !== null) ||
        (qtyObj.comboId === item.comboId && item.comboId !== null)
    );

    const currentQuantity = currentQuantityObj ? currentQuantityObj.quantity : 0;
    console.log("Current Quantity for Item:", currentQuantity);

    const newlyAddedIndex = this.newlyAddedItems.findIndex(newlyAddedItem => this.itemsAreEqual(newlyAddedItem, item));
    console.log("Index in newlyAddedItems:", newlyAddedIndex);

    if (newlyAddedIndex !== -1) {
      // Item already exists in newlyAddedItems, update the quantity
      const newQuantity = item.quantity;
      const updatedQuantity = newQuantity - currentQuantity;
      
      if (updatedQuantity > 0) {
        // Update quantity and total price for existing item
        this.newlyAddedItems[newlyAddedIndex].quantity = updatedQuantity;
        this.newlyAddedItems[newlyAddedIndex].totalPrice = updatedQuantity * (this.newlyAddedItems[newlyAddedIndex].discountedPrice || this.newlyAddedItems[newlyAddedIndex].price);
      } else if (updatedQuantity === 0) {
        // Remove item if quantity is 0
        this.newlyAddedItems.splice(newlyAddedIndex, 1);
      }
    } else if (item.quantity > currentQuantity) {
      // Item is new or its quantity has increased, add to newlyAddedItems
      const newItem = {
        ...item,
        quantity: item.quantity - currentQuantity, // Only add the new quantity
        totalPrice: (item.quantity - currentQuantity) * (item.discountedPrice || item.price)
      };
      this.newlyAddedItems.push(newItem);
    }

    console.log('Updated Newly Added Items:', this.newlyAddedItems);
  } catch (error) {
    console.error('Error updating newly added items:', error);
  }
}

    
    itemsAreEqual(item1: any, item2: any): boolean {
      return (item1.dishId === item2.dishId && item1.comboId === item2.comboId);
    }

    updateNewlyAddedItems(item: any): void {
      const newlyAddedIndex = this.newlyAddedItems.findIndex(newlyAddedItem => this.itemsAreEqual(newlyAddedItem, item));
      if (newlyAddedIndex !== -1) {
        this.newlyAddedItems[newlyAddedIndex].quantity = item.quantity;
        this.newlyAddedItems[newlyAddedIndex].totalPrice = item.totalPrice;
      } else {
        this.newlyAddedItems.push({
          ...item,
          quantity: item.quantity,
          unitPrice: item.discountedPrice ? item.discountedPrice : item.price,
          totalPrice: item.totalPrice,
        });
      }
      console.log('Updated Newly Added Items:', this.newlyAddedItems);
    }
    // Method to update total price for an item
    updateTotalPrice(index: number): void {
      const item = this.selectedItems[index];
      if (item) {
        item.totalPrice = item.quantity * (item.discountedPrice || item.price);
        this.calculateTotalAmount();
      }
    }
  
    // Method to calculate total price
    getTotalPrice(item: any): number {
      return item.quantity * (item.discountedPrice || item.price);
    }
  
    // Method to validate quantity
    validateQuantity(index: number): void {
      const item = this.selectedItems[index];
      if (item) {
        item.quantity = Math.max(1, Math.min(item.quantity, 100)); // Example: limit between 1 and 100
        this.updateTotalPrice(index);
        this.calculateTotalAmount();
      }
    }
    
    
    
  
    addItem(item: any) {
      // Ensure that the item has a valid quantity
      const quantity = item.quantity || 1;
      const unitPrice = item.discountedPrice ? item.discountedPrice : item.price;
      const totalPrice = quantity * unitPrice; // Calculate total price based on the quantity
    
      // Find if the item already exists in newlyAddedItems
      const newlyAddedIndex = this.newlyAddedItems.findIndex(newlyAddedItem => this.itemsAreEqual(newlyAddedItem, item));
      
      // Find if the item already exists in selectedItems
      const selectedIndex = this.selectedItems.findIndex(selectedItem => this.itemsAreEqual(selectedItem, item));
      
      if (newlyAddedIndex !== -1) {
        // Item already exists in newlyAddedItems, update the quantity
        console.log('Item already exists in newlyAddedItems, updating quantity');
        this.newlyAddedItems[newlyAddedIndex].quantity = quantity;
        this.newlyAddedItems[newlyAddedIndex].totalPrice = totalPrice;
      } else {
        // Item is new, add to newlyAddedItems
        console.log('Item is new, adding to newlyAddedItems');
        this.newlyAddedItems.push({
          ...item,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        });
      }
    
      if (selectedIndex !== -1) {
        // Item already exists in selectedItems, update the quantity
        console.log('Item already exists in selectedItems, updating quantity');
        this.selectedItems[selectedIndex].quantity = quantity;
        this.selectedItems[selectedIndex].totalPrice = totalPrice;
      } else {
        // Item is new, add to selectedItems
        console.log('Item is new, adding to selectedItems');
        this.selectedItems.push({
          ...item,
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          dishesServed: 0
        });
      }
    
      console.log('Newly Added Items:', this.newlyAddedItems);
      console.log('Selected Items:', this.selectedItems);
      
      this.calculateAndSetTotalAmount();
    }
    
    
 
    calculateAndSetTotalAmount(): void {
      // Ensure selectedItems is not null or undefined
      if (!this.selectedItems) {
        this.totalAmount = 0;
        this.totalAmountAfterDiscount = 0;
        return;
      }
    
      // Calculate the total amount before discount
      this.totalAmount = this.selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
      // Ensure selectedDiscountPercent is a valid number
      if (this.selectedDiscountPercent && !isNaN(this.selectedDiscountPercent)) {
        this.totalAmountAfterDiscount = this.totalAmount * (1 - this.selectedDiscountPercent / 100);
      } else {
        this.totalAmountAfterDiscount = this.totalAmount;
      }
    }
    
    removeItem(index: number) {
      const removedItem = this.selectedItems[index];
      console.log('Removing item:', removedItem);
  
      this.selectedItems.splice(index, 1);
      console.log('Updated selectedItems:', this.selectedItems);
  
      // Remove the item from newlyAddedItems if it exists
      const newlyAddedIndex = this.newlyAddedItems.findIndex(item => this.itemsAreEqual(item, removedItem));
      if (newlyAddedIndex !== -1) {
          this.newlyAddedItems.splice(newlyAddedIndex, 1);
          console.log('Removed from newlyAddedItems:', this.newlyAddedItems);
      }
  
      // Add the removed item to newlyAddedItems with quantity 0
      const unitPrice = removedItem.discountedPrice ? removedItem.discountedPrice : removedItem.price;
      this.newlyAddedItems.push({
          ...removedItem,
          quantity: 0,
          unitPrice: unitPrice,
          totalPrice: unitPrice
      });
  
      console.log('Updated newlyAddedItems:', this.newlyAddedItems);
  }
  applyDiscount(): void {
    if (this.selectedDiscount !== null) {
      // Find the selected discount
      const discount = this.discount.find((d: Discount) => d.discountId === this.selectedDiscount);
      if (discount) {
        this.selectedDiscountName = discount.discountName;
        this.selectedDiscountPercent = discount.discountPercent;
  
        // Recalculate the total amount with the discount applied
        this.calculateTotalAmountAfterDiscount();
  
        // Optionally close the modal programmatically
        this.closeModal();
      }
    } else {
      // No discount selected, set totalAmountAfterDiscount to totalAmount
      this.totalAmountAfterDiscount = this.totalAmount;
      console.error('No discount selected.');
    }
  }
  
  // Existing methods for context
  calculateTotalAmount(): void {
    this.totalAmount = this.selectedItems.reduce((acc, item) => acc + this.getTotalPrice(item), 0);
    this.calculateTotalAmountAfterDiscount();
  }
  
  calculateTotalAmountAfterDiscount(): void {
    if (this.selectedDiscount !== null) {
      const discountPercent = this.selectedDiscountPercent || 0;
      this.totalAmountAfterDiscount = this.totalAmount - (this.totalAmount * (discountPercent / 100));
    } else {
      this.totalAmountAfterDiscount = this.totalAmount;
    }
  }

    clearSelectedDiscount() {
      this.selectedDiscount = null;
      this.selectedDiscountName = '';
      this.selectedDiscountPercent = 0;
  }
  onItemClick(discount: Discount) {
    this.selectedDiscount = discount.discountId;
    this.selectedDiscountName = discount.discountName;
    this.selectedDiscountPercent = discount.discountPercent;
    console.log('Discount selected:', this.selectedDiscount);
  }  
 // Method to load active discounts and set selected discount
  LoadActiveDiscounts(orderDiscountId: number): void {
  this.discountService.getActiveDiscounts().subscribe(
    (data) => {
      this.discount = data;
      
      // Find the discount based on orderDiscountId and set it as selectedDiscount
      const discount = this.discount.find(d => d.discountId === orderDiscountId);
      if (discount) {
        this.selectedDiscount = discount.discountId;
        this.selectedDiscountName = discount.discountName;
        this.selectedDiscountPercent = discount.discountPercent;
      } else {
        // Handle the case where the discount is not found
        this.selectedDiscount = null;
        this.selectedDiscountName = '';
        this.selectedDiscountPercent = 0;
      }
      
      console.log('Active Discounts:', this.discount);
      console.log('Selected Discount:', this.selectedDiscount);
    },
    (error) => {
      console.error('Error fetching active discounts:', error);
    }
  );
}

  getOrder(orderId: number): void {
    this.orderDetailService.getOrderDetail(orderId).subscribe(
      (response: ListOrderDetailByOrder) => {
        this.selectedOrder = response;
        this.selectedItems = response.orderDetails;
        if (response.discountId) {
          this.selectedDiscount = response.discountId;
          const discount = this.discount.find(d => d.discountId === response.discountId);
          if (discount) {
            this.selectedDiscountName = discount.discountName;
            this.selectedDiscountPercent = discount.discountPercent;
          }
        }
        this.calculateAndSetTotalAmount();
        console.log('Order details:', this.selectedOrder);
      },
      (error: HttpErrorResponse) => {
        console.error('Error fetching order details:', error);
        this.errorMessage = 'Error fetching order details';
      }
    );
  }
  
}
