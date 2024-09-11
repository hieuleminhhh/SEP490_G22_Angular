import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Address, AddNewAddress } from '../../../../models/address.model';
import { ListAllCombo } from '../../../../models/combo.model';
import { ListAllDishes } from '../../../../models/dish.model';
import { AddNewOrder } from '../../../../models/order.model';
import { AddOrderDetail } from '../../../../models/orderDetail.model';
import { ManagerComboService } from '../../../../service/managercombo.service';
import { ManagerDishService } from '../../../../service/managerdish.service';
import { ManagerOrderService } from '../../../../service/managerorder.service';
import { SidebarOrderComponent } from '../../SidebarOrder/SidebarOrder.component';
import { InvoiceService } from '../../../../service/invoice.service';
import { NoteDialogComponent } from '../../../common/material/NoteDialog/NoteDialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CurrencyFormatPipe } from '../../../common/material/currencyFormat/currencyFormat.component';
import { DateFormatPipe } from '../../../common/material/dateFormat/dateFormat.component';
import { ItemInvoice } from '../../../../models/invoice.model';
import { PercentagePipe } from '../../../common/material/percentFormat/percentFormat.component';
import { Discount } from '../../../../models/discount.model';
import { DiscountService } from '../../../../service/discount.service';
import { CheckoutService } from '../../../../service/checkout.service';
import { HeaderOrderStaffComponent } from "../HeaderOrderStaff/HeaderOrderStaff.component";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap/modal/modal.module';
import { SettingService } from '../../../../service/setting.service';

@Component({
  selector: 'app-CreateTakeAwayOrder',
  templateUrl: './CreateTakeAwayOrder.component.html',
  styleUrls: ['./CreateTakeAwayOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, CurrencyFormatPipe, DateFormatPipe, PercentagePipe, HeaderOrderStaffComponent]
})
export class CreateTakeAwayOrderComponent implements OnInit {

  constructor(private router: Router, private dishService: ManagerDishService, private comboService: ManagerComboService,
    private orderService: ManagerOrderService, private cd: ChangeDetectorRef, private invoiceService: InvoiceService,
    private route: ActivatedRoute, private dialog: MatDialog, private discountService: DiscountService, private checkoutService: CheckoutService,
    private settingService: SettingService) { }
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
  discount: any = {};
  searchCategory: string = '';
  search: string = '';
  showingDishes: boolean = true;
  showingCombos: boolean = false;
  successMessage: string = '';
  searchTerm: string = '';
  selectedAddress = '';
  showDropdown: boolean = false;
  paymentMethod: string = '0';
  customerPaid: number | null = null;
  paymentAmount: number = 0;
  invoice: any = {};
  selectedDiscount: any | null = null;
  selectedDiscountName: string = '';
  selectedDiscountPercent: number = 0;
  totalAmountAfterDiscount: number = 0;
  totalAmount: number = 0;

  timeOptions: string[] = [];
  addNew: AddNewOrder = {
    guestPhone: '',
    email: 'N/A',
    addressId: 0,
    guestAddress: '',
    consigneeName: '',
    orderDate: new Date(),
    status: 2,
    recevingOrder: '',
    totalAmount: 0,
    deposits: 0,
    note: '',
    type: 1,
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
  ischecked: boolean = false;
  lastOrderId: number | undefined;
  discountInvalid: any = {};
  accountId: number | null = null;
  newAddress: AddNewAddress = {
    guestAddress: '',
    consigneeName: '',
    guestPhone: '',
    email: 'N/A',
  };
  date: string = '';
  time: string = '';
  isEarliest: boolean = true;
  minDate: string | undefined;
  maxDate: string | undefined;
  availableHours: string[] = [];
  ngOnInit() {
    this.loadListDishes();
    this.loadListCombo();
    this.loadAddresses();
    const today = new Date();
    this.selectedAddress = "Khách lẻ"
    this.selectCategory('Món chính');
    this.LoadActiveDiscounts();
    this.calculateAndSetTotalAmount();
    this.selectedDiscount = null;
    this.generateTimeOptions();
    this.setDefaultReceivingTime();
    this.paymentMethod = '0';
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    this.date = this.formatDate(today);
    this.minDate = this.formatDate(today);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    this.maxDate = this.formatDate(maxDate);
    this.generateAvailableHours();
    console.log(today);
    console.log(this.date);
    console.log(this.time);
    this.updateTimes();
    this.getInfo();
  }
  formatDate(date: Date): string {
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
  generateAvailableHours() {
    this.availableHours = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
        this.availableHours.push(formattedHour);
      }
    }
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
      this.loadListDishes(this.searchCategory, this.search);
    } else if (this.showingCombos) {
      this.loadListCombo(this.search);
    }
  }

  showDishes() {
    this.showingDishes = true;
    this.showingCombos = false;
  }

  showCombos() {
    this.showingCombos = !this.showingCombos;
    this.showingDishes = false;
    this.showingCombos = true;
    this.searchCategory = '';
  }
  addItem(item: any) {
    // Determine whether the item is a dish or a combo
    const isCombo = item.hasOwnProperty('quantityCombo');
    
    // Use the appropriate quantity property based on whether it's a dish or combo
    const availableQuantity = isCombo ? item.quantityCombo : item.quantityDish;
  
    // Find if the item already exists in selectedItems
    const index = this.selectedItems.findIndex(selectedItem => this.itemsAreEqual(selectedItem, item));
  
    if (index !== -1) {
      // If the item already exists, check if we can still increase its quantity
      if (this.selectedItems[index].quantity < availableQuantity) {
        // Increase its quantity and update the total price if the quantity is less than available stock
        this.selectedItems[index].quantity++;
        this.selectedItems[index].totalPrice = this.selectedItems[index].quantity * this.selectedItems[index].unitPrice;
      } else {
        // Show a message if the quantity exceeds the available stock
        this.errorMessage = 'Không thể thêm món này nữa, số lượng đã đạt giới hạn.';
        this.clearErrorMessageAfterTimeout();
      }
    } else {
      // If the item does not exist, add it to selectedItems with quantity 1 and set the total price
      const unitPrice = item.discountedPrice ? item.discountedPrice : item.price;
  
      // Only add if there is at least 1 item available in stock
      if (availableQuantity > 0) {
        this.selectedItems.push({ ...item, quantity: 1, unitPrice: unitPrice, totalPrice: unitPrice });
      } else {
        this.errorMessage = 'Món này đã hết hàng.';
        this.clearErrorMessageAfterTimeout();
      }
    }
  
    // Recalculate totalAmount and totalAmountAfterDiscount after adding the item
    this.calculateAndSetTotalAmount();
  }
  clearErrorMessageAfterTimeout() {
    setTimeout(() => {
      this.errorMessage = '';  // Clear the message after 5 seconds
    }, 2000);  // 5000 milliseconds = 5 seconds
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
    const maxQuantity = this.getMaxQuantity(item);
    
    // Ensure the quantity is at least 1
    if (item.quantity < 1) {
      item.quantity = 1;
    } 
    // Ensure the quantity doesn't exceed the available quantity
    else if (item.quantity > maxQuantity) {
      item.quantity = maxQuantity;
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
  
  clearSelectedDiscount() {
    this.selectedDiscount = null;
    this.selectedDiscountName = '';
    this.selectedDiscountPercent = 0;
  }
  clearCart() {
    this.selectedDiscount = null;
    this.selectedDiscountName = '';
    this.selectedDiscountPercent = 0;
    this.selectedItems = [];
    this.selectedAddress = "Khách lẻ"
    this.selectCategory('Món chính');
    this.addNew.guestPhone = null;
    this.addNew.email = null;
    this.addNew.guestAddress = null;
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
  selectAddress(address: Address) {
    this.selectedAddress = `${address.consigneeName} - ${address.guestPhone}`;
    this.addNew.guestPhone = address.guestPhone;
    this.addNew.email = 'N/A';
    this.addNew.guestAddress = 'N/A';
    this.addNew.consigneeName = address.consigneeName;
    this.showDropdown = false;
    console.log('Selected Address:', this.addNew);
  }
  extractConsigneeName(addressString: string): string {
    return addressString.split(' - ')[0];
  }

  extractGuestPhone(addressString: string): string | null {
    const phone = addressString.split(' - ')[1];
    return phone && phone.trim() ? phone : null; // Return null if the phone is empty
  }


  openNoteDialog(item: any): void {
    const dialogRef = this.dialog.open(NoteDialogComponent, {
      width: '300px',
      data: { note: item.note },
      position: {
        left: '500px',
        top: '-900px'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        item.note = result;
      }
    });
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
        .qr-code-container {
          text-align: center;
          margin: 20px 0;
        }
        ..qr-code-container img {
          width: 75px; /* Adjust the width as needed */
          height: 75px; /* Adjust the height as needed */
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
      ${this.invoice.guestPhone ? `
      <div class="mb-3">
        <label for="phoneNumber" class="form-label">Số điện thoại: </label>
        <span id="phoneNumber">${this.invoice.guestPhone || 'N/A'}</span>
      </div>` : ''}
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

      // Conditionally add QR code if paymentMethod equals '1'
      if (this.paymentMethod === '1') {
        printWindow?.document.write(`
        <div class="qr-code-container">
          <label for="qrCode" class="form-label"></label>
          <img id="qrCode" src="https://th.bing.com/th/id/OIP.SzaQ2zk5Q5EsnORQ_zpvGAHaHa?w=202&h=202&c=7&r=0&o=5&dpr=1.3&pid=1.7" class="img-fluid">
        </div>
      `);
      }

      // Add footer
      printWindow?.document.write(`
      <div class="footer">
        Cảm ơn quý khách và hẹn gặp lại!
      </div>
    `);

      // Close the document and trigger print
      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      printWindow?.print();
    } else {
      console.error('Invoice ID is not defined.');
    }
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


  selectKhachLe() {
    this.selectedAddress = 'Khách lẻ';
    this.showDropdown = false;
    this.clearSearchTerm();
  }

  createAddress() {
    this.saveAddress();
  }
  errorMessage: string = '';
  saveAddress() {
    this.orderService.AddNewAddress(this.newAddress).subscribe(
      (response: any) => {
        console.log('Address created successfully:', response); // Debug: Check response here
        this.successMessage = 'Thông tin đã được thêm thành công!';
        setTimeout(() => this.successMessage = '', 3000);

        // Ensure response contains correct properties in 'data'
        if (response && response.data && response.data.consigneeName && response.data.guestPhone) {
          // Update selectedAddress with the newly created address data
          this.selectedAddress = `${response.data.consigneeName} - ${response.data.guestPhone}`;

          // Create newAddress with all required properties
          const newAddress: Address = {
            addressId: response.data.addressId, // Ensure you have this property from the response
            consigneeName: response.data.consigneeName,
            guestPhone: response.data.guestPhone,
            guestAddress: response.data.guestAddress || 'N/A', // Provide default value if necessary
            email: response.data.email || 'N/A', // Provide default value if necessary
          };

          // Call selectAddress with the newly created address data
          this.selectAddress(newAddress);
        } else {
          console.error('Invalid response format after creating address:', response);
        }

        // Reload addresses to update the list
        this.loadAddresses();

      },
      error => {
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Có lỗi xảy ra khi thêm địa chỉ. Vui lòng thử lại.';
        }

        // Clear error message after 5 seconds
        setTimeout(() => this.errorMessage = '', 3000);
      }
    );
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
    this.time = closestTimeOption;
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
  filterAddresses() {
    const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
    this.filteredAddresses = this.addresses.filter(address =>
      address.consigneeName.toLowerCase().includes(lowerCaseSearchTerm) ||
      address.guestPhone.includes(this.searchTerm)
    );
  }
  clearForm() {
    this.newAddress = { consigneeName: '', guestPhone: '', guestAddress: '', email: '' };
  }
  addErrors: any = {};
  addErrorMessage: string = '';
  clearAddErrors() {
    this.addErrors = {};
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
  updateTotalAmountWithDiscount() {
    const totalAmount = this.calculateTotalAmount();
    console.log('Total Amount:', totalAmount); // Kiểm tra giá trị totalAmount
    const discountAmount = totalAmount * (this.selectedDiscountPercent / 100);
    console.log('Discount Amount:', discountAmount); // Kiểm tra giá trị discountAmount
    this.totalAmountAfterDiscount = totalAmount - discountAmount;
    console.log('Total Amount After Discount:', this.totalAmountAfterDiscount); // Kiểm tra giá trị totalAmountAfterDiscount
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
  onDiscountSelect(discountId: number) {
    if (this.selectedDiscount === discountId) {
      this.selectedDiscount = null; // Bỏ chọn nếu đã được chọn trước đó
    } else {
      this.selectedDiscount = discountId; // Chọn mã giảm giá mới
    }
  }
  formatDateTime(date: string, time: string): string {
    return `${date}T${time}:00.000Z`;
  }
  createOrder() {
    if (!this.selectedItems || this.selectedItems.length === 0) {
      console.error('No items selected for the order.');
      return;
    }

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

    const totalAmount = this.selectedDiscount ? this.totalAmountAfterDiscount : this.calculateTotalAmount();
    let receivingTime: string = '';
    if (this.date && this.time) {
      receivingTime = this.formatDateTime(this.date, this.time);
    } else {
      const currentTime = new Date();
      currentTime.setHours(currentTime.getHours() + 1);
      receivingTime = this.formatDateTime(currentTime.toISOString().split('T')[0], currentTime.toTimeString().split(' ')[0].substring(0, 5));
    }

    const customerPaidAmount = this.customerPaid ?? 0;
    const paymentMethodValue = parseInt(this.paymentMethod, 10) ?? 0;

    this.addNew = {
      ...this.addNew,
      totalAmount,
      orderDetails,
      orderDate: this.getVietnamTime(),
      recevingOrder: receivingTime,
      deposits: 0,
      paymentMethods: paymentMethodValue,
      description: '',
      discountId: this.selectedDiscount,
      taxcode: 'ABCD',
      paymentStatus: 0,
      accountId: this.accountId
    };

    console.log('Order Details:', this.addNew);

    this.orderService.AddNewOrder(this.addNew).subscribe(
      response => {
        console.log('Order created successfully:', response);
        this.lastOrderId = response.orderId;
        console.log(this.lastOrderId);
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


  CreateInvoiceTakeAway(): void {
    if (this.lastOrderId != null && this.lastOrderId !== undefined) {
      const paymentMethod = parseInt(this.paymentMethod, 10);
      const totalAmount = this.selectedDiscount ? this.totalAmountAfterDiscount : this.calculateTotalAmount();

      const amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : totalAmount;
      const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - totalAmount : 0;

      const updateData = {
        paymentTime: new Date().toISOString(),
        paymentAmount: totalAmount,
        taxcode: "HIEU",
        paymentStatus: 1,
        accountId: this.accountId,
        amountReceived,
        returnAmount,
        paymentMethods: paymentMethod,
        description: "Order payment description"
      };

      console.log('Update Data:', updateData);

      this.invoiceService.updateStatusAndCreateInvoice(this.lastOrderId, updateData).subscribe(
        response => {
          console.log('Order status updated and invoice created:', response);
          this.loadInvoice(this.lastOrderId!);
        },
        error => {
          console.error('Error updating order status and creating invoice:', error);
        }
      );
    } else {
      console.warn('Order ID is not valid or is undefined. LastOrderId:', this.lastOrderId);
    }
  }


  loadInvoice(orderId: number): void {
    this.invoiceService.getInvoiceByOrderId(orderId).subscribe(
      data => {
        this.invoice = data;
      },
      error => {
        console.error('Error fetching invoice:', error);
      }
    );
  }
  getDiscountAmount(): number {
    if (this.invoice?.totalAmount && this.invoice?.discountPercent) {
      return (this.invoice.totalAmount * this.invoice.discountPercent) / 100;
    }
    return 0;
  }
  formatCustomerPaid(event: any) {
    let input = event.target.value;

    // Remove any non-digit characters except for the period (.)
    input = input.replace(/[^0-9]/g, '');

    // Add thousand separators using a regular expression
    const formattedValue = input.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Only update if the formatted value is not null
    if (formattedValue !== null) {
      this.customerPaid = formattedValue;
    }
  }

  updateOrderStatus(id:any){
    const data ={
      status: 5
    }
    this.invoiceService.updateOrderStatus(id,data).subscribe(
      data => {
        this.clearCart();
      },
      error => {
        console.error('Error fetching invoice:', error);
      }
    );
  }
  settings: any;
  QRUrl: string = '';
  getInfo(): void {
    this.settingService.getInfo().subscribe(
      response => {
        this.settings = response;
        console.log(response);
        this.QRUrl = this.settings[0].qrcode;
        console.log(this.QRUrl);
        console.log('URL Logo',this.QRUrl);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
}
