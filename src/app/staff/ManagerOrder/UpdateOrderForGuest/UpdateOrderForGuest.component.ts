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
import { CheckoutService } from '../../../../service/checkout.service';
@Component({
  selector: 'app-UpdateOrderForGuest',
  templateUrl: './UpdateOrderForGuest.component.html',
  styleUrls: ['./UpdateOrderForGuest.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, CurrencyFormatPipe, DateFormatPipe, PercentagePipe]
})
export class UpdateOrderForGuestComponent implements OnInit {

  constructor(private router: Router, private orderService: ManagerOrderService, private route: ActivatedRoute,  private dishService: ManagerDishService,
    private comboService: ManagerComboService,private orderDetailService: ManagerOrderDetailService, private invoiceService : InvoiceService, private discountService: DiscountService,
    private checkoutService: CheckoutService ) { }
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
 discountInvalid: any = {};
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
 discounts: Discount[] = [];
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
    this.calculateTotalAmount(this.orderId);
    this.LoadActiveDiscounts();
    this.LoadActiveDiscountByOrderID(this.orderId);
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
        this.closeModal();
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
    
  applyDiscount(orderId: number): void {
    if (this.selectedDiscount !== null) {
      // Find the selected discount
      const discount = this.discounts.find((d: Discount) => d.discountId === this.selectedDiscount);
      if (discount) {
        this.selectedDiscount = discount.discountId;
        this.selectedDiscountName = discount.discountName;
        this.selectedDiscountPercent = discount.discountPercent;
  
        // Recalculate the total amount with the discount applied
        this.calculateTotalAmountAfterDiscount(orderId);
  
        // Optionally close the modal programmatically
        this.closeModal();
      } else {
        console.error('Selected discount not found.');
      }
    } else {
      console.error('No discount selected.');
    }
  }
  
  calculateTotalAmountAfterDiscount(orderId: number): void {
    this.orderDetailService.getOrderDetail(orderId).subscribe((orderDetail) => {
        // totalAmount hiện tại đã được tính trước khi gọi hàm này
        // bạn có thể bỏ dòng này nếu không cần cập nhật từ DB
        this.totalAmount = this.totalAmount || orderDetail.totalAmount;

        if (this.selectedDiscount !== null) {
            const discountPercent = this.selectedDiscountPercent || 0;
            console.log('Discount Percent:', discountPercent);
            this.totalAmountAfterDiscount = this.totalAmount - (this.totalAmount * (discountPercent / 100));
            console.log('Total Amount After Discount:', this.totalAmountAfterDiscount);
        } else {
            this.totalAmountAfterDiscount = this.totalAmount;
            console.log('Total Amount Without Discount:', this.totalAmountAfterDiscount);
        }
    }, error => {
        console.error('Failed to retrieve order details', error);
        // Handle the error appropriately, e.g., set default values or display an error message
    });
}

  increaseQuantity(index: number, orderId: number): void {
    const item = this.selectedItems[index];
    if (item) {
      item.quantity++;
      this.updateTotalPrice(index, orderId);
      this.addOrUpdateNewlyAddedItem(item);
    }
  }
  
  
  // Method to decrease item quantity
  decreaseQuantity(index: number, orderId: number): void {
    const item = this.selectedItems[index];
    if (item && item.quantity > 1) {
      item.quantity--;
      this.updateTotalPrice(index, orderId);
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
  updateTotalPrice(index: number, orderId: number): void {
    const item = this.selectedItems[index];
    if (item) {
      item.totalPrice = item.quantity * (item.discountedPrice || item.price);
      console.log(`Item ${index} total price updated to: ${item.totalPrice}`);
      this.calculateTotalAmount(orderId);
    }
  }
  
  calculateTotalAmount(orderId: number): void {
    this.totalAmount = this.selectedItems.reduce((acc, item) => acc + this.getTotalPrice(item), 0);
    console.log('Calculated total amount:', this.totalAmount);
    
    // Recalculate the total amount after applying any discount
    this.calculateTotalAmountAfterDiscount(orderId);
  }
  

  // Method to calculate total price
  getTotalPrice(item: any): number {
    return item.quantity * (item.discountedPrice || item.price);
  }

  // Method to validate quantity
  validateQuantity(index: number, orderId: number): void {
    const item = this.selectedItems[index];
    if (item) {
      // Validate quantity within the specified range (1 to 100)
      item.quantity = Math.max(1, Math.min(item.quantity, 100));
  
      // Update the total price and recalculate the total amount
      this.updateTotalPrice(index, orderId);
    }
  }
  
  
  addItem(item: any) {
    console.log('Initial item:', item);
  
    // Ensure that the item has a valid quantity
    let quantity = item.quantity;
    if (quantity === undefined || quantity === null || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      quantity = 1; // Default quantity to 1 if it's invalid
    } else {
      quantity = Number(quantity);
    }
  
    const unitPrice = item.discountedPrice ? item.discountedPrice : item.price;
    const totalPrice = quantity * unitPrice; // Calculate total price based on the quantity
  
    // Find if the item already exists in newlyAddedItems
    const newlyAddedIndex = this.newlyAddedItems.findIndex(newlyAddedItem => this.itemsAreEqual(newlyAddedItem, item));
    const selectedIndex = this.selectedItems.findIndex(selectedItem => this.itemsAreEqual(selectedItem, item));
  
    if (newlyAddedIndex !== -1) {
      // Item already exists in newlyAddedItems, update the quantity and totalPrice
      this.newlyAddedItems[newlyAddedIndex].quantity += quantity;
      this.newlyAddedItems[newlyAddedIndex].totalPrice += totalPrice;
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
      // Item already exists in selectedItems, update the quantity and totalPrice
      console.log('Item already exists in selectedItems, updating quantity');
      this.selectedItems[selectedIndex].quantity += quantity;
      this.selectedItems[selectedIndex].totalPrice += totalPrice;
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
    if (!this.selectedItems || this.selectedItems.length === 0) {
        this.totalAmount = 0;
        this.totalAmountAfterDiscount = 0;
        return;
    }

    // Tính tổng số tiền, xem xét cả giá giảm cho từng món
    this.totalAmount = this.selectedItems.reduce((acc, item) => {
        const itemPrice = item.discountedPrice ? item.discountedPrice : item.price;
        return acc + (itemPrice * item.quantity);
    }, 0);
    console.log("Total Amount Before Discount:", this.totalAmount);

    // Đảm bảo rằng tỷ lệ giảm giá tổng thể là một số hợp lệ
    const discountPercent = this.selectedDiscountPercent || 0;
    this.totalAmountAfterDiscount = this.totalAmount * (1 - discountPercent / 100);
    console.log("Total Amount After Discount:", this.totalAmountAfterDiscount);
}

// Call this method after every operation that changes the selected items or discount

  
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
        quantity: 102,
        unitPrice: unitPrice,
        totalPrice: unitPrice
    });

    console.log('Updated newlyAddedItems:', this.newlyAddedItems);
}
  

    clearSelectedDiscount() {
      this.selectedDiscount = null;
      this.selectedDiscountName = '';
      this.selectedDiscountPercent = 0;
  }
  // LoadActiveDiscounts(): void {
  //   this.discountService.getActiveDiscounts().subscribe((data) => {
  //     this.discounts = data;
  //     this.applyExistingDiscount();
  //   }, (error) => {
  //     console.error('Error fetching active discounts:', error);
  //   });
  // }
  LoadActiveDiscounts(): void {
    this.checkoutService.getListDiscount().subscribe(
      response => {
        this.applyExistingDiscount();
        console.log(response);

        const today = new Date(); // Ngày hiện tại

        this.discounts = response.filter((d: {
          totalMoney: number; startTime: string; endTime: string;
        }) => {
          const startDate = new Date(d.startTime);
          const endDate = new Date(d.endTime);
          return d.totalMoney <= this.totalAmount && today >= startDate && today <= endDate;
        });
        console.log(today);

        console.log(648,this.discounts);

        this.discountInvalid = response.filter((d: {
          totalMoney: number; startTime: string; endTime: string;
        }) => {
          const startDate = new Date(d.startTime);
          const endDate = new Date(d.endTime);
          return d.totalMoney > this.totalAmount || today < startDate || today > endDate;
        });
        console.log(657,this.discountInvalid);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
 // Method to load active discounts and set selected discount
 LoadActiveDiscountByOrderID(orderDiscountId: number): void {
  this.discountService.getDiscountByOrderId(orderDiscountId).subscribe(
    (data) => {
      if (data) {
        this.selectedDiscount = data.discountId;
        this.selectedDiscountName = data.discountName;
        this.selectedDiscountPercent = data.discountPercent;
      } else {
        // Handle the case where the discount is not found
        this.selectedDiscount = null;
        this.selectedDiscountName = '';
        this.selectedDiscountPercent = 0;
      }

      console.log('Selected Discount:', this.selectedDiscount);
    },
    (error) => {
      console.error('Error fetching discount by order ID:', error);
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
          console.log('640,'+this.selectedDiscount);
          const discount = this.discounts.find(d => d.discountId === response.discountId);
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
  updateOrderDetails(orderId: number): void {
    // Extract newly added items to update in the DB
    const orderDetails = this.newlyAddedItems.map(item => ({
      dishId: item.dishId || null,
      comboId: item.comboId || null,
      quantity: item.quantity,
      note: item.note || '', // Assuming you have a note property or set it to an empty string
      orderTime: new Date().toISOString() // Assuming you want the current time
    }));
  
    // Log the data before sending
    console.log('Updating order details with newly added items:', orderDetails);
  
    // Construct the dto object
    const dto = {
      discountId: this.selectedDiscount || 0,
      orderDetails: orderDetails
    };
  
    // Call the service method to update the order details
    this.orderService.updateOrderDetailsByOrderId(orderId, dto).subscribe(
      response => {
        console.log('Order details updated successfully:', response);
        this.successMessage = 'Order details updated successfully!';
        
        // Clear newlyAddedItems after successful update
        this.newlyAddedItems = [];


        // Delay một chút để modal đóng hoàn toàn trước khi reload
        setTimeout(() => {
          window.location.reload();
        }, 500); // 500ms có thể điều chỉnh nếu cần
      },
      (error: HttpErrorResponse) => {
        console.error('Error updating order details:', error);
        this.errorMessage = 'Error updating order details';
      }
    );
  }
  
  onItemClick(discount: Discount) {
    this.selectedDiscount = discount.discountId;
    this.selectedDiscountName = discount.discountName;
    this.selectedDiscountPercent = discount.discountPercent;
    console.log('Discount selected:', this.selectedDiscount);
    this.updateOrderDetails(this.orderId)
  }  
  applyExistingDiscount(): void {
    if (this.selectedDiscount !== null) {
      const discount = this.discounts.find(d => d.discountId === this.selectedDiscount);
      if (discount) {
        this.selectedDiscountName = discount.discountName;
        this.selectedDiscountPercent = discount.discountPercent;
        this.calculateTotalAmountAfterDiscount(this.orderId);
      }
    }
  }
  UpdateOrderAndCreateInvoice(orderId: number): void {
    if (orderId) { // Use the method parameter directly
      const updateData = {
        status: 0,
        paymentTime: new Date().toISOString(), // Use the current date and time
        paymentAmount: 0,
        taxcode: "string",
        accountId: 0,
        amountReceived: 0,
        returnAmount: 0,
        paymentMethods: 0,
        description: "string"
      };
  
      this.invoiceService.updateStatusAndCreateInvoice(orderId, updateData).subscribe(
        (response) => {
          console.log('Order status updated and invoice created:', response);
        },
        (error: HttpErrorResponse) => {
          console.error('Error updating order status and creating invoice:', error);
          this.errorMessage = 'Error updating order status and creating invoice';
        }
      );
    }
  }
  onDiscountSelect(discountId: number) {
    if (this.selectedDiscount === discountId) {
      this.selectedDiscount = null; // Bỏ chọn nếu đã được chọn trước đó
    } else {
      this.selectedDiscount = discountId; // Chọn mã giảm giá mới
    }
  }
   getDiscountAmount(): number {
    if (!this.selectedDiscount || this.selectedItems.length === 0) {
      return 0;
    }

    // Calculate the total amount of selected items
    const totalAmount = this.selectedItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

    // Calculate the discount amount
    const discountAmount = totalAmount * (this.selectedDiscountPercent / 100);
    
    return discountAmount;
  }
}
