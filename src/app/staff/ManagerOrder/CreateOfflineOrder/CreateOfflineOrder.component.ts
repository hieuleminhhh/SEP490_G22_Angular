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
import { InvoiceService } from '../../../../service/invoice.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../common/material/ConfirmDialog/ConfirmDialog.component';
import { CurrencyFormatPipe } from '../../../common/material/currencyFormat/currencyFormat.component';
import { DateFormatPipe } from '../../../common/material/dateFormat/dateFormat.component';
import { PercentagePipe } from '../../../common/material/percentFormat/percentFormat.component';
import { Discount } from '../../../../models/discount.model';
import { DiscountService } from '../../../../service/discount.service';
import { NoteDialogComponent } from '../../../common/material/NoteDialog/NoteDialog.component';
import { CheckoutService } from '../../../../service/checkout.service';
import { AccountService } from '../../../../service/account.service';
import { HeaderOrderStaffComponent } from "../HeaderOrderStaff/HeaderOrderStaff.component";
@Component({
    selector: 'app-create-offline-order',
    templateUrl: './CreateOfflineOrder.component.html',
    styleUrls: ['./CreateOfflineOrder.component.css'],
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, CurrencyFormatPipe, DateFormatPipe, PercentagePipe, HeaderOrderStaffComponent]
})
export class CreateOfflineOrderComponent implements OnInit {
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
  selectedAddress = '';
  discount: any = {};
  newAddress: AddNewAddress = {
    guestAddress: '',
    consigneeName: '',
    guestPhone: '',
    email:'antaiquan@gmail.com',
  };
  discountInvalid: any = {};
  paymentMethod: string = '0';
  customerPaid: number | null = null;
  paymentAmount: number = 0;
  selectedDiscount: any | null = null;
  selectedDiscountName: string = '';
  selectedDiscountPercent: number = 0;
  totalAmountAfterDiscount: number = 0;
  totalAmount: number = 0;
  addNew: any = {};
  accountId: number | null = null;
  account: any;
  showSidebar: boolean = true; 
  constructor(private router: Router, private orderService: ManagerOrderService, private route: ActivatedRoute,  private dishService: ManagerDishService,
   private comboService: ManagerComboService,private orderDetailService: ManagerOrderDetailService, private invoiceService : InvoiceService, private dialog: MatDialog
   ,private discountService: DiscountService,
   private checkoutService: CheckoutService, private accountService: AccountService) { }
  @ViewChild('formModal') formModal!: ElementRef;
  ngOnInit() {
    this.loadListDishes();
    this.loadListCombo();
    this.loadAddresses();
    this.selectedAddress = "Khách lẻ"
    this.selectCategory('Món chính');
    this.route.queryParams.subscribe(params => {
      this.tableId = +params['tableId']; 
      this.loadListOrderByTable(this.tableId);
    });
    this.LoadActiveDiscounts();
    this.calculateAndSetTotalAmount();
    this.selectedDiscount = null;
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
  
    console.log('31', this.accountId);
  
    if (this.accountId) {
      this.getAccountDetails(this.accountId);
    } else {
      console.error('Account ID is not available');
    }
  }

  loadListOrderByTable(tableId: number): void {
    console.log('Loading orders for table ID:', tableId);
    this.orderService.getOrdersByTableId(tableId).subscribe(
      (response: any) => {
        if (response && response.data && response.data.orderDetails && response.data.orderDetails.length > 0) {
          this.selectedItems = response.data.orderDetails.map((orderItem: any) => ({
            orderDetailId: orderItem.orderDetailId,
            dishId: orderItem.dishId,
            comboId: orderItem.comboId,
            itemName: orderItem.dish.itemName,
            unitPrice: orderItem.unitPrice,
            dishesServed: orderItem.dishesServed || 0,
            price: orderItem.dish.price,
            discountedPrice: orderItem.dish.discountedPrice,
            quantity: orderItem.quantity,
            imageUrl: orderItem.dish.imageUrl,
            totalPrice: orderItem.dish.discountedPrice ? orderItem.dish.discountedPrice * orderItem.quantity : orderItem.dish.price * orderItem.quantity,
          }));
          console.log('Fetched order details:', this.selectedItems);
        } else {
          console.error('Invalid response:', response);
          this.selectedItems = []; 
        }
      },
      (error: HttpErrorResponse) => {
        console.error('Error fetching orders:', error);
        this.errorMessage = error.error.message || 'Bàn này không có đơn hàng nào...';
        this.selectedItems = []; // Clear the cart if there's an error
      }
    );
  }
  clearCart() {
    this.selectedItems = [];
    this.selectedDiscount = null;
    this.selectedDiscount = null;
    this.selectedDiscountName = '';
    this.selectedDiscountPercent = 0;
    this.selectCategory('Món chính');
    this.successMessage = "Tất cả các mặt hàng đã được xóa khỏi giỏ hàng.";
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
      type: 0, 
      paymentTime: '',
    paymentAmount: 0,
    discountId: 0,
    taxcode: '',
    paymentStatus: 0,
    amountReceived: 0,
    returnAmount: 0,
    paymentMethods: 0,
    description: ''      // Assuming note is of type string
      // Add more properties as required by the AddNewOrder type/interface
    };
    this.router.navigate(['/listTable']); 
  }
  
  private parseDateString(dateStr: string): Date | null {
    if (!dateStr) return null; // Handle empty date strings
    
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
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
  // addItem(item: any) {
  //   // Find if the item already exists in selectedItems
  //   const index = this.selectedItems.findIndex(selectedItem => this.itemsAreEqual(selectedItem, item));
  
  //   if (index !== -1) {
  //     // If the item already exists, increase its quantity and update the total price
  //     this.increaseQuantity(index);
  //   } else {
  //     // If the item does not exist, add it to selectedItems with quantity 1 and set the total price
  //     // Use discountedPrice if available, otherwise fallback to price
  //     const unitPrice = item.discountedPrice ? item.discountedPrice : item.price;
  //     this.selectedItems.push({ ...item, quantity: 1, unitPrice: unitPrice, totalPrice: unitPrice });
  //   }
  
  //   // Recalculate totalAmount after adding item
  //   this.calculateTotalAmount();
  // }
  increaseQuantity(index: number): void {
    if (this.selectedItems[index].quantity < 100) {
      this.selectedItems[index].quantity++;
      this.selectedItems[index].totalPrice = this.selectedItems[index].quantity * this.selectedItems[index].unitPrice;
      this.validateQuantity(index);
      this.calculateAndSetTotalAmount();
    }
  }
  
  decreaseQuantity(index: number): void {
    if (this.selectedItems[index].quantity > 1) {
      this.selectedItems[index].quantity--;
      this.selectedItems[index].totalPrice = this.selectedItems[index].quantity * this.selectedItems[index].unitPrice;
      this.validateQuantity(index);
      this.calculateAndSetTotalAmount();
    }
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
  
    // Recalculate totalAmount and totalAmountAfterDiscount after adding item
    this.calculateAndSetTotalAmount();
  }
  
  validateQuantity(index: number): void {
    const item = this.selectedItems[index];
    if (item.quantity < 1) {
      item.quantity = 1;
    } else if (item.quantity > 100) {
      item.quantity = 100;
    }
    // Update the total price after validating the quantity
    item.totalPrice = item.quantity * item.unitPrice;
    // Recalculate total amount
    this.calculateTotalAmount();
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
    this.dishService.ListDishes(this.currentPage,6, search, searchCategory ).subscribe(
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
  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;
        console.log('Account details:', this.account);
        console.log('Account role:', this.account.role);
        this.showSidebar = this.account.role !== 'OrderStaff';
      },
      error => {
        console.error('Error fetching account details:', error);
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
    updateQuantity(index: number, newQuantity: number) {
      if (newQuantity >= 1 && newQuantity <= 100) {
        this.selectedItems[index].quantity = newQuantity;
        this.selectedItems[index].totalPrice = this.selectedItems[index].quantity * this.selectedItems[index].unitPrice;
      }
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
    
    createOrderOffline(tableId: number): void {
      const orderDetails = this.selectedItems.map(item => ({
        dishId: item.dishId,
        comboId: item.comboId,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discountedPrice: item.discountedPrice,
        orderTime: new Date(),
        note: item.note
      }));
      const totalAmount = this.selectedDiscount ? this.totalAmountAfterDiscount : this.calculateTotalAmount();
      const currentDate = new Date();
      const customerPaidAmount = this.customerPaid ?? 0; // Default to 0 if customerPaid is null
      const paymentMethodValue = parseInt(this.paymentMethod, 10) ?? 0; 
      const guestPhone = this.addNew.guestPhone ? this.addNew.guestPhone : '';

      const newOrder = {
        tableId: tableId,
        guestAddress: this.addNew.guestAddress,
        consigneeName: this.addNew.consigneeName,
        orderDate: new Date().toISOString(),
        receivingOrder: null,
        guestPhone: guestPhone,
        note: "This is a special request note.",
        discountId: this.selectedDiscount,
        type: 4,
        status: 3,
        orderDetails: orderDetails
      };
      
      this.orderService.createOrderOffline(newOrder).subscribe(
        response => {
          console.log('Offline order created successfully:', response);
          this.successMessage = 'Offline order created successfully!';
          setTimeout(() => this.successMessage = '', 5000);
        },
        error => {
          console.error('Error creating offline order:', error);
          if (error.error && error.error.errors) {
            console.error('Validation errors:', error.error.errors);
          }
        }
      );
    }
    clearSelectedDiscount() {
      this.selectedDiscount = null;
      this.selectedDiscountName = '';
      this.selectedDiscountPercent = 0;
  }
  LoadActiveDiscounts(): void {
    this.checkoutService.getListDiscount().subscribe(
      response => {
        console.log(response);

        const today = new Date(); // Ngày hiện tại

        this.discount = response.filter((d: {
          totalMoney: number; startTime: string; endTime: string;
        }) => {
          const startDate = new Date(d.startTime);
          const endDate = new Date(d.endTime);
          return d.totalMoney <= this.totalAmount && today >= startDate && today <= endDate;
        });
        console.log(today);

        console.log(648,this.discount);

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
  onItemClick(discount: Discount) {
    this.selectedDiscount = discount.discountId;
    this.selectedDiscountName = discount.discountName;
    this.selectedDiscountPercent = discount.discountPercent;
    console.log('Discount selected:', this.selectedDiscount);
  }  
 // Method to apply the discount
 applyDiscount() {
  if (this.selectedDiscount !== null) {
    // Find the selected discount
    const discount = this.discount.find((d: Discount) => d.discountId === this.selectedDiscount);
    if (discount) {
      this.selectedDiscountName = discount.discountName;
      this.selectedDiscountPercent = discount.discountPercent;

      // Recalculate the total amount with the discount applied
      this.updateTotalAmountWithDiscount();

      // Optionally close the modal programmatically
      this.closeModal();
    }
  } else {
    // No discount selected, set totalAmountAfterDiscount to totalAmount
    this.totalAmountAfterDiscount = this.calculateTotalAmount();
    console.error('No discount selected.');
  }
}
  
    confirmOrder(): void {
      this.createOrderOffline(this.tableId);
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
    clearForm() {
      this.newAddress = { consigneeName: '', guestPhone: '', guestAddress: '' , email: '' };
    }
    addErrors: any = {};
    addErrorMessage: string = '';
    clearAddErrors() {
      this.addErrors = {};
    }
    calculateTotalAmount(): number {
      return this.selectedItems.reduce((total, item) => total + item.totalPrice, 0);
    }
    calculateAndSetTotalAmount() {
      this.totalAmount = this.calculateTotalAmount();
      if (this.selectedDiscount !== null) {
        this.updateTotalAmountWithDiscount();
      } else {
        this.totalAmountAfterDiscount = this.totalAmount; // Khi không có discount
      }
    }
    
    updateTotalAmountWithDiscount() {
      const totalAmount = this.calculateTotalAmount();
      console.log('Total Amount:', totalAmount); // Kiểm tra giá trị totalAmount
      const discountAmount = totalAmount * (this.selectedDiscountPercent / 100);
      console.log('Discount Amount:', discountAmount); // Kiểm tra giá trị discountAmount
      this.totalAmountAfterDiscount = totalAmount - discountAmount;
      console.log('Total Amount After Discount:', this.totalAmountAfterDiscount); // Kiểm tra giá trị totalAmountAfterDiscount
    }
    openNoteDialog(item: any): void {
      const dialogRef = this.dialog.open(NoteDialogComponent, {
        width: '300px',
        data: { note: item.note },
        position: {
          left: '500px', // Adjust the horizontal position
          top: '-900px' // Adjust the vertical position
        }
      });
    
      dialogRef.afterClosed().subscribe(result => {
        if (result !== undefined) {
          item.note = result;
        }
      });
    }
    onDiscountSelect(discountId: number) {
      if (this.selectedDiscount === discountId) {
        this.selectedDiscount = null; // Bỏ chọn nếu đã được chọn trước đó
      } else {
        this.selectedDiscount = discountId; // Chọn mã giảm giá mới
      }
    }
    
}
