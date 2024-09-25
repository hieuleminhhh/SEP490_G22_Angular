import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SidebarOrderComponent } from '../../SidebarOrder/SidebarOrder.component';
import { ManagerDishService } from '../../../../service/managerdish.service';
import { Address, AddNewAddress } from '../../../../models/address.model';
import { ListAllCombo } from '../../../../models/combo.model';
import { ListAllDishes } from '../../../../models/dish.model';
import { AddNewOrder } from '../../../../models/order.model';
import { AddOrderDetail } from '../../../../models/orderDetail.model';
import { ManagerComboService } from '../../../../service/managercombo.service';
import { ManagerOrderService } from '../../../../service/managerorder.service';
import { InvoiceService } from '../../../../service/invoice.service';
import { NoteDialogComponent } from '../../../common/material/NoteDialog/NoteDialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CurrencyFormatPipe } from '../../../common/material/currencyFormat/currencyFormat.component';
import { DateFormatPipe } from '../../../common/material/dateFormat/dateFormat.component';
import { ItemInvoice } from '../../../../models/invoice.model';
import { DiscountService } from '../../../../service/discount.service';
import { PercentagePipe } from '../../../common/material/percentFormat/percentFormat.component';
import { Discount } from '../../../../models/discount.model';
import { CheckoutService } from '../../../../service/checkout.service';
import { HeaderOrderStaffComponent } from "../HeaderOrderStaff/HeaderOrderStaff.component";
import { SettingService } from '../../../../service/setting.service';
import { NotificationService } from '../../../../service/notification.service';
import { Title } from '@angular/platform-browser';
import { CategoryService } from '../../../../service/category.service';
@Component({
  selector: 'app-CreateOnlineOrder',
  templateUrl: './CreateOnlineOrder.component.html',
  styleUrls: ['./CreateOnlineOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, MatDialogModule, CurrencyFormatPipe, DateFormatPipe, PercentagePipe, HeaderOrderStaffComponent]
})
export class CreateOnlineOrderComponent implements OnInit {

  constructor(private router: Router, private dishService: ManagerDishService, private comboService: ManagerComboService, private orderService: ManagerOrderService,
    private invoiceService: InvoiceService, private dialog: MatDialog, private renderer: Renderer2, private discountService: DiscountService, private checkoutService: CheckoutService,
    private settingService: SettingService,private notificationService: NotificationService, private titleService: Title, private categoryService: CategoryService) {
    const today = new Date();
    this.date = this.formatDate(today);
    this.minDate = this.formatDate(today); // Ngày nhận tối thiểu là ngày hiện tại
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    this.maxDate = this.formatDate(maxDate);
  }
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
  discount: any = {};
  discountInvalid: any = {};
  paymentMethod: string = '0';
  customerPaid: number | null = null;
  paymentAmount: number = 0;
  selectedDiscount: any | null = null;
  selectedDiscountName: string = '';
  selectedDiscountPercent: number = 0;
  totalAmountAfterDiscount: number = 0;
  totalAmount: number = 0;
  lastOrderId: any;
  accountId: number | null = null;
  addNew: AddNewOrder = {
    guestPhone: '',
    email: '',
    addressId: 0,
    guestAddress: '',
    consigneeName: '',
    orderDate: new Date(),
    status: 2,
    recevingOrder: '',
    totalAmount: 0,
    deposits: 0,
    note: '',
    type: 2,
    orderDetails: [],
    paymentTime: '',
    paymentAmount: 0,
    discountId: 0,
    taxcode: '',
    paymentStatus: 0,
    amountReceived: 0,
    returnAmount: 0,
    paymentMethods: 0,
    description: '',
    accountId: 0
  };
  invoice: any = {};
  orderTime: string = 'Giao hàng sớm nhất';
  date: string = '';
  time: string = '';
  isEarliest: boolean = true;
  minDate: string; // Ngày nhận tối thiểu là ngày hiện tại
  maxDate: string;
  availableHours: string[] = [];
  private socket!: WebSocket;
  private reservationQueue: any[] = [];
  @ViewChild('paymentModal') paymentModal!: ElementRef;
  ngOnInit() {
    this.titleService.setTitle('Bán hàng | Eating House');
    this.getAllCategories();
    this.loadListDishes();
    this.loadListCombo();
    const today = new Date();
    this.receivingDate = this.formatDate(today);
    this.generateTimeOptions();
    this.setDefaultReceivingTime();
    this.selectCategory('Món chính');
    this.LoadActiveDiscounts();
    this.calculateAndSetTotalAmount();
    this.selectedDiscount = null;
    console.log("Select discount " + this.selectedDiscount);
    this.updateTimes();
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    console.log(this.date);
    console.log(this.time);
    this.selectTime();
    this.getInfo();
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
      while (this.reservationQueue.length > 0) {
        this.socket.send(this.reservationQueue.shift());
      }
    };
    this.socket.onclose = () => {
      console.log('WebSocket connection closed, attempting to reconnect...');
      setTimeout(() => {
        this.initializeWebSocket(); // Hàm khởi tạo WebSocket
      }, 5000); // Thử lại sau 5 giây
    };
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  initializeWebSocket() {
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => { /* xử lý onopen */ };
    this.socket.onmessage = (event) => { /* xử lý onmessage */ };
    this.socket.onclose = () => { /* xử lý onclose */ };
    this.socket.onerror = (error) => { /* xử lý onerror */ };
  }
  createNotification(orderId: number) {
    let description;
    let body;
    description = `Có đơn hàng mới. Vui lòng xem danh sách các món ăn để làm! `;
    body = {
      description: description,
      orderId: orderId,
      type: 4
    }
    this.makeReservation(description);
    this.notificationService.createNotification(body).subscribe(
      response => {
        console.log(response);
        // this.callFunctionInB(this.accountGuest);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  makeReservation(reservationData: any) {
    const message = JSON.stringify(reservationData);

    // Check if the WebSocket connection (this.socket) is defined
    if (!this.socket) {
      console.error('WebSocket is not initialized.');
      return; // Exit the function if socket is not defined
    }

    // Check the WebSocket readyState
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message); // Send the reservation request if WebSocket is open
    } else if (this.socket.readyState === WebSocket.CONNECTING) {
      this.reservationQueue.push(message); // Queue the message if WebSocket is connecting
    } else {
      console.log('WebSocket is not open. Current state:', this.socket.readyState);
    }
  }
  selectTime() {
    const currentTime = new Date();
    currentTime.setHours(currentTime.getHours() + 1); // Thêm 1 giờ

    // Lấy giờ và phút từ currentTime và định dạng thành chuỗi 'HH:MM'
    const currentTimeStr = currentTime.toTimeString().split(' ')[0].substring(0, 5);

    // Gán giá trị giờ phút cho biến receivingTime
    this.receivingTime = currentTimeStr;

    console.log(this.receivingTime); // In ra giá trị của receivingTime
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
  onSubmit(form: NgForm) {
    if (form.invalid) {
      alert('Vui lòng nhập đủ các trường cần thiết.');
      return;
    }

    // Mở modal nếu form hợp lệ
    // Mở modal nếu form hợp lệ
    this.renderer.addClass(this.paymentModal.nativeElement, 'show');
    this.renderer.setStyle(this.paymentModal.nativeElement, 'display', 'block');
    this.renderer.setStyle(this.paymentModal.nativeElement, 'opacity', '1');
  }
  loadListDishes(search: string = '', searchCategory: string = ''): void {
    console.log('Loading dishes with search term:', search);
    this.dishService.ListDishesActive(this.currentPage, 100, search, searchCategory).subscribe(
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
    this.comboService.ListComboActive(this.currentPage, 100, search).subscribe(
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
      this.loadListDishes(this.selectedCategory, this.search);
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
  validateQuantity(index: number): void {
    const item = this.selectedItems[index];

    // Determine the maximum quantity based on whether the item is a dish or a combo

    // Ensure the quantity is at least 1
    if (item.quantity < 1) {
      item.quantity = 1;
    }
    // Ensure the quantity doesn't exceed the available quantity
    else if (item.quantity > 1000) {
      item.quantity = 1000;
    }

    // Update the total price after validating the quantity
    item.totalPrice = item.quantity * item.unitPrice;

    // Recalculate the total amount after changes
    this.calculateAndSetTotalAmount();
  }

  getMaxQuantity(item: any): number {
    // Check if the item is a combo or a dish
    if (item.hasOwnProperty('quantityCombo')) {
      // Return the quantityCombo if the item is a combo
      return item.quantityCombo;
    } else if (item.hasOwnProperty('quantityDish')) {
      // Return the quantityDish if the item is a dish
      return item.quantityDish;
    }
    // Default to a high number if quantity properties are not found
    return Number.MAX_SAFE_INTEGER;
  }

  errorMessage: string = '';

  addItem(item: any) {
    // Determine whether the item is a dish or a combo
    const isCombo = item.hasOwnProperty('quantityCombo');

    // Use the appropriate quantity property based on whether it's a dish or combo
    const availableQuantity = isCombo ? item.quantityCombo : item.quantityDish;

    // Find if the item already exists in selectedItems
    const index = this.selectedItems.findIndex(selectedItem => this.itemsAreEqual(selectedItem, item));

    if (index !== -1) {
      // If the item already exists, simply increase its quantity and update the total price
      this.selectedItems[index].quantity++;
      this.selectedItems[index].totalPrice = this.selectedItems[index].quantity * this.selectedItems[index].unitPrice;
    } else {
      // If the item does not exist, add it to selectedItems with quantity 1 and set the total price
      const unitPrice = item.discountedPrice ? item.discountedPrice : item.price;

      // Directly add the item without checking for availableQuantity
      this.selectedItems.push({ ...item, quantity: 1, unitPrice: unitPrice, totalPrice: unitPrice });
    }

    // Recalculate totalAmount and totalAmountAfterDiscount after adding the item
    this.calculateAndSetTotalAmount();
  }

clearErrorMessageAfterTimeout() {
  setTimeout(() => {
    this.errorMessage = '';  // Clear the message after 5 seconds
  }, 5000);  // 5000 milliseconds = 5 seconds
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

  createOrder() {
    // Ensure selectedItems is defined
    if (!this.selectedItems || this.selectedItems.length === 0) {
      console.error('No items selected for the order.');
      return;
    }

    // Map selected items to order details
    const orderDetails: AddOrderDetail[] = this.selectedItems.map(item => ({
      itemId: item.id,
      quantity: item.quantity,
      price: item.price,
      unitPrice: item.totalPrice,
      dishId: item.dishId,
      comboId: item.comboId,
      orderTime: this.getVietnamTime(),
      note: item.note
    }));


    // Calculate total amount and set various properties

    let receivingTime: string = '';
    if (this.date && this.time) {
      receivingTime = this.formatDateTime(this.date, this.time);
    } else {
      const currentTime = new Date();
      currentTime.setHours(currentTime.getHours() + 1);
      const currentDate = currentTime.toISOString().split('T')[0];
      const currentTimeStr = currentTime.toTimeString().split(' ')[0].substring(0, 5);
      receivingTime = this.formatDateTime(currentDate, currentTimeStr);
    }
    const totalAmount = this.selectedDiscount ? this.totalAmountAfterDiscount : this.calculateTotalAmount();
    const customerPaidAmount = this.customerPaid ?? 0; // Default to 0 if customerPaid is null
    const paymentMethod = parseInt(this.paymentMethod, 10); // Convert paymentMethod to number
    this.addNew = {
      ...this.addNew, // Spread existing properties if any
      totalAmount,
      orderDetails,
      orderDate: this.getVietnamTime(),
      recevingOrder: receivingTime,
      deposits: 0,
      paymentMethods: paymentMethod,
      description: 'Order payment description',
      discountId: this.selectedDiscount,
      taxcode: 'ABCD',
      paymentStatus: 0,
      accountId: this.accountId,
      type: 2
    };

    console.log(this.addNew);

    // Log order details for debugging
    console.log('Order Details:', orderDetails);

    // Call the service to add the new order
    this.orderService.AddNewOrder(this.addNew).subscribe(
      response => {
        console.log('Order created successfully:', response);
        this.successMessage = 'Đơn hàng đã được tạo thành công!';

        this.lastOrderId = response.orderId;
        setTimeout(() => this.successMessage = '', 5000);
      },
      error => {
        console.error('Error creating order:', error);
        if (error && error.error && error.error.message) {
          console.error('Inner exception:', error.error.message);
        }
      }
    );
  }

  loadInvoice(orderId: number): void {
    // Fetch invoice data by ID
    this.invoiceService.getInvoiceByOrderId(orderId).subscribe(
      data => {
        this.invoice = data;
      },
      error => {
        console.error('Error fetching invoice:', error);
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

  updateQuantity(index: number, newQuantity: number) {
    if (newQuantity >= 1 && newQuantity <= 100) {
      this.selectedItems[index].quantity = newQuantity;
      this.selectedItems[index].totalPrice = this.selectedItems[index].quantity * this.selectedItems[index].unitPrice;
    }
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
      type: 0,
      paymentTime: '',
      paymentAmount: 0,
      discountId: 0,
      taxcode: '',
      paymentStatus: 0,
      amountReceived: 0,
      returnAmount: 0,
      paymentMethods: 0,
      description: '',
      accountId: 0     // Assuming note is of type string
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
      description: '',
      accountId: 0    // Assuming note is of type string
      // Add more properties as required by the AddNewOrder type/interface
    };
  }
  clearSelectedDiscount() {
    this.selectedDiscount = null;
    this.selectedDiscountName = '';
    this.selectedDiscountPercent = 0;
  }
  transform(value: string | Date, format: string = 'dd/MM/yyyy HH:mm', locale: string = 'vi-VN'): string {
    if (!value) return '';

    let date: Date;
    if (typeof value === 'string') {
      date = new Date(value);
      if (isNaN(date.getTime())) {
        return value;
      }
    } else {
      date = value;
    }
    return formatDate(date, format, locale);
  }
  formatDateForPrint(date: Date | string | null): string {
    if (!date) return 'N/A';
    return this.transform(date, 'dd/MM/yyyy HH:mm');
  }
  printInvoice(): void {
    console.log('Invoice data before update:', this.invoice);
    if (this.invoice.invoiceId) {
      const printWindow = window.open('', '', 'height=600,width=800');

      // Write the content to the new window
      printWindow?.document.write('<html><head><title>Invoice</title>');
      printWindow?.document.write(`
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
        }
        .header p {
          margin: 5px 0;
        }
        hr {
          margin: 20px 0;
          border: 0;
          border-top: 1px solid #000;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .table th, .table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .table th {
          background-color: #f2f2f2;
        }
        .text-right {
          text-align: right;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          border-top: 1px solid #000;
          padding-top: 10px;
          font-style: italic;
        }
      </style>
    `);
      printWindow?.document.write('</head><body>');

      // Add restaurant information
      printWindow?.document.write(`
      <div class="header">
        <h1>Eating House</h1>
        <p>Địa chỉ: Khu công nghệ cao Hòa Lạc</p>
        <p>Hotline: 0393578176 - 0987654321</p>
        <p>Email: eatinghouse@gmail.com</p>
        <hr>
      </div>
    `);

      // Add invoice information
      printWindow?.document.write(`
      <div class="mb-3">
        <label for="orderID" class="form-label">Mã hóa đơn: </label>
        <span id="orderID">${this.invoice?.invoiceId || 'N/A'}</span>
      </div>
      <div class="mb-3">
        <label for="customerName" class="form-label">Tên khách hàng:</label>
        <span id="customerName">${this.invoice.consigneeName || 'Khách lẻ'}</span>
      </div>
      <div class="mb-3">
        <label for="phoneNumber" class="form-label">Số điện thoại: </label>
        <span id="phoneNumber">${this.invoice.guestPhone || 'N/A'}</span>
      </div>
      <div class="mb-3">
        <label for="orderDate" class="form-label">Ngày đặt hàng:</label>
        <span id="orderDate">${this.formatDateForPrint(this.invoice?.orderDate)}</span>
      </div>
      <div class="mb-3">
        <table class="table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên món</th>
              <th>SL</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${(this.invoice?.itemInvoice || []).map((item: ItemInvoice, i: number) => `
              <tr>
                <td>${i + 1}</td>
                <td>${item.itemName || item.nameCombo}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                <td>${item.unitPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="mb-3">
        <label for="totalOrder" class="form-label">Tiền hàng:</label>
        <span id="totalOrder">${this.invoice?.totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
      </div>
      <div class="mb-3">
        <label for="discount" class="form-label">Khuyến mãi:</label>
         <span id="discount">${this.getDiscountAmount().toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })} (${this.invoice?.discountPercent || '0'}%)</span>
      </div>
      <hr>
      <div class="mb-3">
        <label for="totalAmount" class="form-label">Tổng tiền:</label>
        <span id="totalAmount">${this.invoice?.paymentAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
      </div>
    `);
      // Add footer
      printWindow?.document.write(`
      <div class="footer">
        <p>Cảm ơn quý khách và hẹn gặp lại!</p>
      </div>
    `);

      printWindow?.document.write('</body></html>');

      // Print the content
      printWindow?.document.close();
      printWindow?.print();
    }
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

        console.log(648, this.discount);

        this.discountInvalid = response.filter((d: {
          totalMoney: number; startTime: string; endTime: string;
        }) => {
          const startDate = new Date(d.startTime);
          const endDate = new Date(d.endTime);
          return d.totalMoney > this.totalAmount || today < startDate || today > endDate;
        });
        console.log(657, this.discountInvalid);
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


  // Method to calculate the total amount before discount
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
  onDiscountSelect(discountId: number) {
    if (this.selectedDiscount === discountId) {
      this.selectedDiscount = null;
    } else {
      this.selectedDiscount = discountId;
    }
  }
  saveTime() {
    console.log(this.date, this.time);

    if (this.isEarliest) {
      this.orderTime = 'Giao hàng sớm nhất';
    } else {
      // Xử lý khi người dùng nhập ngày và giờ
      if (this.date && this.time) {
        this.orderTime = 'Ngày:' + this.date + '  Giờ:' + this.time;
      } else {
        console.error('Ngày hoặc giờ chưa được nhập.');
        // Có thể thực hiện các xử lý khác tại đây, ví dụ hiển thị thông báo lỗi
      }
    }

    console.log('Đã lưu thời gian:', this.orderTime);
    this.hideModal(); // Đóng modal sau khi lưu thành công
  }
  toggleEdit() {
    // Hiển thị modal khi nhấn vào nút "Thay đổi"
    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  hideModal() {
    // Đóng modal
    if (!this.date || !this.time) {
      this.isEarliest = true;
    }
    this.receivingTime = this.time;
    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  formatDate(date: Date): string {
    // Hàm chuyển đổi định dạng ngày thành chuỗi "YYYY-MM-DD"
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  updateTimes(): void {
    const now = new Date();
    const selectedDate = new Date(this.date);
    const isToday = now.toDateString() === selectedDate.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    this.availableHours = [];

    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (isToday && (hour > currentHour || (hour === currentHour && minute >= currentMinute))) {
          this.addTimeOption(hour, minute);
        } else if (!isToday) {
          this.addTimeOption(hour, minute);
        }
      }
    }
  }
  addTimeOption(hour: number, minute: number): void {
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    this.availableHours.push(time);
  }
  onEarliestChange() {
    if (this.isEarliest) {
      this.date = new Date().toISOString().split('T')[0];
      this.time = '';
      this.selectTime();
    }
  }
  getDiscountAmount(): number {
    if (this.invoice?.totalAmount && this.invoice?.discountPercent) {
      return (this.invoice.totalAmount * this.invoice.discountPercent) / 100;
    }
    return 0;
  }
  CreateInvoiceOnline(): void {
    if (this.lastOrderId != null && this.lastOrderId !== undefined) {
      const paymentMethod = parseInt(this.paymentMethod, 10);
      const totalAmount = this.selectedDiscount ? this.totalAmountAfterDiscount : this.calculateTotalAmount();

      const amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : totalAmount;
      const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - totalAmount : 0;
      let status = 0;
      let deposite = 0
      if (paymentMethod === 0 || paymentMethod === 1) {
        status = 1;
        deposite = totalAmount
      }

      const updateData = {
        status: 6,
        paymentTime: new Date().toISOString(),
        paymentAmount: totalAmount,
        taxcode: "HIEU",
        paymentStatus: status,
        accountId: this.accountId,
        amountReceived,
        returnAmount,
        paymentMethods: paymentMethod,
        description: "",
        deposits: deposite,
      };

      console.log('Update Data:', updateData);

      this.invoiceService.updateStatusAndCreateInvoice(this.lastOrderId, updateData).subscribe(
        async response => {
          console.log('Order status updated and invoice created:', response);
          this.loadInvoice(this.lastOrderId!);
          this.createNotification(response.orderId);
          // Gửi email thông báo cho khách hàng
          try {
            const emailResponse = await this.orderService.sendOrderEmail(this.lastOrderId).toPromise();
            const customerEmail = emailResponse?.email; // Safe access to email

            if (customerEmail) {
              await this.orderService.sendEmail(
                customerEmail,
                'Thông báo đơn hàng từ Eating House',
                `Kính gửi quý khách,<br><br>
                Bạn có một đơn hàng đã được tạo thành công.<br>
                Cảm ơn bạn đã tin tưởng và lựa chọn Eating House!<br><br>
                Trân trọng,<br>
                Eating House`
              ).toPromise();

              console.log('Email sent successfully to:', customerEmail);
            } else {
              console.error('Customer email not found.');
            }

          } catch (emailError) {
            console.error('Error sending email:', emailError);
          }
        },
        error => {
          console.error('Error updating order status and creating invoice:', error);
        }
      );
    } else {
      console.warn('Order ID is not valid or is undefined. LastOrderId:', this.lastOrderId);
    }
  }


  settings: any;
  QRUrl: string = '';
  getInfo(): void {
    this.settingService.getInfo().subscribe(
      response => {
        this.settings = response;
        console.log(response);
        this.QRUrl = this.settings[0].qrcode;
        console.log('URL Logo',this.QRUrl);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  messages: string[] = [];
  isValid: boolean = false;
  // Thêm thuộc tính trong component
  checkDish(): void{
      this.messages = [];
    let receivingTime: string = '';
    if (this.date && this.time) {
      receivingTime = this.formatDateTime(this.date, this.time);
    } else {
      const currentTime = new Date();
      currentTime.setHours(currentTime.getHours() + 1);
      const year = currentTime.getFullYear();
      const month = String(currentTime.getMonth() + 1).padStart(2, '0');
      const day = String(currentTime.getDate()).padStart(2, '0');

      const currentDate = `${year}-${month}-${day}`;
      const currentTimeStr = currentTime.toTimeString().split(' ')[0].substring(0, 5);
      console.log(currentDate);
      console.log(currentTime);
      receivingTime = this.formatDateTime(currentDate, currentTimeStr);
    }

    let deposits = 0;
    const today = new Date();

    if (this.date === this.formatDate(today)) {
      const data = {
        comboIds: this.selectedItems.map(item => item.comboId).filter(id => id !== undefined),
        dishIds: this.selectedItems.map(item => item.dishId).filter(id => id !== undefined)
      };
      console.log(data);

      this.checkoutService.getRemainingItems(data).subscribe(response => {
        this.messages = []; // Đặt lại messages
        for (const combo of response.combos) {
          const itemInCart = this.selectedItems.find(item => item.comboId === combo.comboId);
          if (itemInCart && combo.quantityRemaining < itemInCart.quantity) {
            this.messages.push(`Không đủ số lượng món ăn: ${combo.name}. Số lượng yêu cầu: ${itemInCart.quantity}, Số lượng còn lại: ${combo.quantityRemaining}`);
            this.isValid = true;
          }
        }
        for (const dish of response.dishes) {
          const itemInCart = this.selectedItems.find(item => item.dishId === dish.dishId);
          if (itemInCart && dish.quantityRemaining < itemInCart.quantity) {
            this.messages.push(`Không đủ số lượng món ăn: ${dish.name}. Số lượng yêu cầu: ${itemInCart.quantity}, Số lượng còn lại: ${dish.quantityRemaining}`);
            this.isValid = true;
          }
        }

        if (this.messages.length > 0) {
          console.log("Có lỗi trong số lượng món ăn.");
          console.log(this.messages);

          return; // Dừng hàm nếu có thông báo
        } else {
          console.log("Tất cả món ăn đều đủ số lượng.");
          const paymentModalButton = document.getElementById('paymentModalButton');
                if (paymentModalButton) {
                    paymentModalButton.click();
                }
        }
        console.log(this.messages.length);
        // Tiếp tục với phần mã xử lý đặt hàng nếu không có lỗi


      }, error => {
        console.error('Error during payment initiation', error);
      });

      return; // Dừng hàm ở đây nếu không muốn chạy mã phía dưới
    } else {
      const paymentModalButton = document.getElementById('paymentModalButton');
      if (paymentModalButton) {
        paymentModalButton.click();
      }
    }

  }
  showMessagesForDuration(duration: number): void {
    setTimeout(() => {
        this.messages = []; // Ẩn thông báo sau khoảng thời gian
    }, duration);
}
onCustomerPaidInput(event: Event): void {
  const input = (event.target as HTMLInputElement).value;
  const sanitizedInput = input.replace(/[^\d]/g, ''); // Chỉ cho phép số

  // Kiểm tra chiều dài của sanitizedInput
  if (sanitizedInput.length > 12) {
    // Cắt sanitizedInput về tối đa 12 ký tự
    const truncatedInput = sanitizedInput.slice(0, 12);
    // Cập nhật giá trị của input để ngăn chặn việc nhập thêm
    (event.target as HTMLInputElement).value = truncatedInput;
    // Cập nhật customerPaid
    this.customerPaid = parseFloat(truncatedInput);
    console.log("Vượt quá giới hạn 12 chữ số.");
    return; // Kết thúc hàm
  }

  // Cập nhật customerPaid nếu chiều dài hợp lệ
  this.customerPaid = sanitizedInput ? parseFloat(sanitizedInput) : null;
}



// Format the number when the input loses focus
formatCurrency(): string {
  if (this.customerPaid !== null) {
    // Chuyển đổi số thành chuỗi và định dạng
    const formattedValue = this.customerPaid.toLocaleString('vi-VN') + 'đ';
    console.log('Formatted Customer Paid:', formattedValue);
    return formattedValue; // Trả về giá trị đã định dạng
  }
  return ''; // Trả về chuỗi rỗng nếu customerPaid là null
}
categories: any;
  getAllCategories() {
    this.categoryService.getAllCategories().subscribe(
      (data: any) => {
        this.categories = data;
        console.log(this.categories); // Kiểm tra cấu trúc dữ liệu
      },
      error => {
        console.error('Error fetching categories', error);
      }
    );
  }
}
