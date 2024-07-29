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
import { AddOrderDetail, ListOrderDetailByOrder } from '../../../../models/orderDetail.model';
import { OrderItem, SelectedItem } from '../../../../models/order.model';
import { InvoiceService } from '../../../../service/invoice.service';
@Component({
  selector: 'app-UpdateOfflineOrder',
  templateUrl: './UpdateOfflineOrder.component.html',
  styleUrls: ['./UpdateOfflineOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent]
})
export class UpdateOfflineOrderComponent implements OnInit {
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
  constructor(private router: Router, private orderService: ManagerOrderService, private route: ActivatedRoute,  private dishService: ManagerDishService,
     private comboService: ManagerComboService,private orderDetailService: ManagerOrderDetailService, private invoiceService : InvoiceService ) { }
  @ViewChild('formModal') formModal!: ElementRef;
  ngOnInit() {
    this.loadListDishes();
    this.loadListCombo();
    this.loadAddresses();
    this.selectCategory('Món chính');
    this.route.queryParams.subscribe(params => {
      this.tableId = +params['tableId']; 
      this.loadListOrderByTable(this.tableId);
    });
  }
  addItem(item: any) {
    // Call API to fetch data from database
    this.orderService.getOrderById(this.orderId).subscribe(
      (dbItemResponse: any) => {
        // Log response for debugging
        console.log('DB Item Response:', dbItemResponse);
  
        // Assume dbItemResponse contains the list of items from the database
        this.dbItems = dbItemResponse;
  
        // Log the current state of dbItems and selectedItems
        console.log('Current DB Items:', this.dbItems);
        console.log('Current Selected Items:', this.selectedItems);
  
        // Helper function to find the index of an item
        const findIndexInList = (list: any[], item: any) => {
          return list.findIndex(listItem => this.itemsAreEqual(listItem, item));
        };
  
        const selectedIndex = findIndexInList(this.selectedItems, item);
        const dbIndex = findIndexInList(this.dbItems, item);
        const newlyAddedIndex = findIndexInList(this.newlyAddedItems, item);
  
        const additionalQuantity = 1; // New quantity added
        const unitPrice = item.discountedPrice || item.price;
        const totalPrice = additionalQuantity * unitPrice;
  
        if (selectedIndex !== -1) {
          // Item exists in selectedItems, update quantity and total price
          console.log('Item exists in selectedItems, updating quantity and total price');
          const existingItem = this.selectedItems[selectedIndex];
          existingItem.quantity += additionalQuantity;
          existingItem.totalPrice = existingItem.quantity * unitPrice;
  
          // Update newlyAddedItems if item exists there
          if (newlyAddedIndex !== -1) {
            this.newlyAddedItems[newlyAddedIndex].quantity += additionalQuantity;
            this.newlyAddedItems[newlyAddedIndex].totalPrice = this.newlyAddedItems[newlyAddedIndex].quantity * unitPrice;
          } else {
            // Add new item to newlyAddedItems if not already there
            if (dbIndex !== -1) {
              const dbItem = this.dbItems[dbIndex];
              const quantityToAdd = Math.max(0, existingItem.quantity - (dbItem.quantity || 0));
              if (quantityToAdd > 0) {
                this.newlyAddedItems.push({
                  ...item,
                  quantity: quantityToAdd,
                  unitPrice: unitPrice,
                  totalPrice: quantityToAdd * unitPrice
                });
              }
            }
          }
        } else if (dbIndex !== -1) {
          // Item exists in dbItems, add to selectedItems and newlyAddedItems
          console.log('Item exists in dbItems, adding to selectedItems and newlyAddedItems');
          const dbItem = this.dbItems[dbIndex];
  
          // Add or update item in selectedItems
          const existingSelectedItemIndex = findIndexInList(this.selectedItems, item);
          if (existingSelectedItemIndex !== -1) {
            this.selectedItems[existingSelectedItemIndex].quantity += additionalQuantity;
            this.selectedItems[existingSelectedItemIndex].totalPrice = this.selectedItems[existingSelectedItemIndex].quantity * unitPrice;
          } else {
            this.selectedItems.push({
              ...dbItem,
              quantity: additionalQuantity,
              unitPrice: unitPrice,
              totalPrice: additionalQuantity * unitPrice
            });
          }
  
          // Add or update item in newlyAddedItems
          const existingNewlyAddedItemIndex = findIndexInList(this.newlyAddedItems, item);
          if (existingNewlyAddedItemIndex === -1) {
            this.newlyAddedItems.push({
              ...dbItem,
              quantity: additionalQuantity,
              unitPrice: unitPrice,
              totalPrice: additionalQuantity * unitPrice
            });
          } else {
            this.newlyAddedItems[existingNewlyAddedItemIndex].quantity += additionalQuantity;
            this.newlyAddedItems[existingNewlyAddedItemIndex].totalPrice = this.newlyAddedItems[existingNewlyAddedItemIndex].quantity * unitPrice;
          }
        } else {
          // Item is new, add to selectedItems and newlyAddedItems
          console.log('Item is new, adding to selectedItems and newlyAddedItems');
          this.selectedItems.push({
            ...item,
            quantity: additionalQuantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice
          });
  
          this.newlyAddedItems.push({
            ...item,
            quantity: additionalQuantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice
          });
  
          console.log('Newly Added Item:', item);
        }
  
        // Log newlyAddedItems for debugging
        console.log('Newly added items:', this.newlyAddedItems);
      },
      (error: any) => {
        // Handle API error
        console.error('Error fetching item data:', error);
      }
    );
  }
  
  itemsAreEqual(item1: any, item2: any): boolean {
    const isEqual = (item1.dishId === item2.dishId || item1.comboId === item2.comboId) &&
                    (item1.dishId != null || item1.comboId != null);
  
    // Log the items being compared and the result of comparison
    console.log('Comparing items:', item1, item2, 'Result:', isEqual);
  
    return isEqual;
  }
  

updateOrderOffline(tableId: number) {
    // Chỉ lấy các mục mới thêm vào để cập nhật vào DB
    const orderDetails = this.newlyAddedItems.map(item => ({
        dishId: item.dishId || null,
        comboId: item.comboId || null,
        quantity: item.quantity,
        note: item.note || '', // Assuming you have a note property or set it to an empty string
        orderTime: new Date().toISOString() // Assuming you want the current time
    }));

    // In ra dữ liệu trước khi gửi
    console.log('Updating offline order with details:', orderDetails);

    // Construct the order object
    const updatedOrder = {
        tableId: tableId,
        orderDetails: orderDetails
    };

    // Call the service method to update the order
    this.orderService.updateOrderOffline(updatedOrder).subscribe(
        response => {
            console.log('Offline order updated successfully:', response);
            this.successMessage = 'Offline order updated successfully!';
            setTimeout(() => this.successMessage = '', 5000);

            // Clear newlyAddedItems after successful update
            this.newlyAddedItems = [];
        },
        error => {
            console.error('Error updating offline order:', error);
            if (error.error && error.error.errors) {
                console.error('Validation errors:', error.error.errors);
            }
        }
    );
}

  loadListOrderByTable(tableId: number): void {
    console.log('Loading orders for table ID:', tableId);
    this.orderService.getOrdersByTableId(tableId).subscribe(
      (response: any) => {
        if (response && response.data && response.data.orderDetails && response.data.orderDetails.length > 0) {
          this.selectedItems = response.data.orderDetails.map((orderItem: any) => {
            if (orderItem) {
              let itemName = orderItem.dish?.itemName ?? '';
              let nameCombo = orderItem.combo?.nameCombo ?? '';
              const unitPrice = orderItem.dish?.discountedPrice ?? orderItem.dish?.price ?? orderItem.combo?.discountedPrice ?? orderItem.combo?.price ?? 0;
              const totalPrice = unitPrice * orderItem.quantity;

              return {
                orderDetailId: orderItem.orderDetailId,
                dishId: orderItem.dishId,
                comboId: orderItem.comboId,
                itemName: itemName,
                nameCombo: nameCombo,
                unitPrice: orderItem.unitPrice,
                dishesServed: orderItem.dishesServed || 0,
                price: orderItem.dish?.price || orderItem.combo?.price || 0,
                discountedPrice: orderItem.dish?.discountedPrice,
                quantity: orderItem.quantity,
                imageUrl: orderItem.dish?.imageUrl || orderItem.combo?.imageUrl || '',
                totalPrice: totalPrice || 0
              } as SelectedItem;
            } else {
              console.warn('Invalid order item:', orderItem);
              return null;
            }
          }).filter((item: SelectedItem | null): item is SelectedItem => item !== null);

          // Cập nhật thông tin khách hàng
          this.selectedOrder = {
            guestName: response.data.consigneeName,
            guestPhone: response.data.guestPhone,
            guestAddress: response.data.guestAddress
          };
          this.orderId = response.data.orderId;

          console.log('Fetched order details:', this.selectedItems);
        } else {
          console.error('Invalid response:', response);
          this.selectedItems = [];
          this.selectedOrder = {
            guestName: 'N/A',
            guestPhone: 'N/A',
            guestAddress: 'N/A'
          };
        }
      },
      (error: HttpErrorResponse) => {
        console.error('Error fetching orders:', error);
        this.errorMessage = error.error.message || 'Bàn này không có đơn hàng nào...';
        this.selectedItems = [];
        this.selectedOrder = {
          guestName: 'N/A',
          guestPhone: 'N/A',
          guestAddress: 'N/A'
        };
      }
    );
  }

  
  private parseDateString(dateStr: string): Date | null {
    if (!dateStr) return null; // Handle empty date strings
    
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  
  loadInvoice(invoiceId: number): void {
    this.invoiceService.getInvoiceById(invoiceId).subscribe(
      data => {
        this.invoice = data;
      },
      error => {
        console.error('Error fetching invoice:', error);
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
  
  removeItem(index: number) {
    this.selectedItems.splice(index, 1);
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
    selectKhachLe() {
      this.selectedAddress = 'Khách lẻ';
      this.showDropdown = false;
      this.clearSearchTerm(); 
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
 
  createInvoiceOffline(orderId: number) {
    const totalAmount = this.calculateTotalAmount();
    const currentDate = new Date();
    const customerPaidAmount = this.customerPaid ?? 0; // Default to 0 if customerPaid is null
    const paymentMethodValue = parseInt(this.paymentMethod, 10) ?? 0;
  
    const invoiceData = {
      orderId: this.orderId,
      paymentTime: currentDate.toISOString(),
      paymentAmount: totalAmount,
      discountId: 0,
      taxcode: 'ZXCVBNM',
      paymentStatus: 1,
      amountReceived: paymentMethodValue === 0 ? customerPaidAmount : totalAmount,
      returnAmount: paymentMethodValue === 0 ? customerPaidAmount - totalAmount : 0,
      paymentMethods: paymentMethodValue,
      description: 'azzvbb'
    };
  
    console.log('Creating invoice with data:', invoiceData);
  
    this.invoiceService.createInvoiceOffline(invoiceData).subscribe(
      response => {
        console.log('Invoice created successfully:', response);
        if (response && response.invoiceId) {
          console.log(response.invoiceId);
          this.loadInvoice(response.invoiceId);
        } else {
          console.error('No invoiceId returned from the service.');
        }
        this.successMessage = 'Invoice created successfully!';
        setTimeout(() => this.successMessage = '', 5000);
      },
      error => {
        console.error('Error creating invoice:', error);
        this.errorMessage = 'Failed to create invoice. Please try again later.';
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

}
