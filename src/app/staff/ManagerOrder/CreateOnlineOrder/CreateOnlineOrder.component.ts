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
import { InvoiceService } from '../../../../service/invoice.service';
import { NoteDialogComponent } from '../../../common/material/NoteDialog/NoteDialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CurrencyFormatPipe } from '../../../common/material/currencyFormat/currencyFormat.component';
@Component({
  selector: 'app-CreateOnlineOrder',
  templateUrl: './CreateOnlineOrder.component.html',
  styleUrls: ['./CreateOnlineOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, MatDialogModule, CurrencyFormatPipe]
})
export class CreateOnlineOrderComponent implements OnInit {

  constructor(private router: Router, private dishService: ManagerDishService, private comboService: ManagerComboService, private orderService : ManagerOrderService,
     private invoiceService: InvoiceService,private dialog: MatDialog) { }
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
  paymentMethod: string = '0';
  customerPaid: number | null = null;
  paymentAmount: number = 0;
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
    orderDetails: [],
    paymentTime: '',
    paymentAmount: 0,
    discountId: 0,
    taxcode: '',
    paymentStatus: 0,
    amountReceived: 0,
    returnAmount: 0,
    paymentMethods: 0,
    description: ''
  };
  invoice: any = {};
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
increaseQuantity(index: number): void {
  if (this.selectedItems[index].quantity < 100) {
    this.selectedItems[index].quantity++;
    this.selectedItems[index].totalPrice = this.selectedItems[index].quantity * this.selectedItems[index].unitPrice;
    this.validateQuantity(index);
    this.calculateTotalAmount();
  }
}

decreaseQuantity(index: number): void {
  if (this.selectedItems[index].quantity > 1) {
    this.selectedItems[index].quantity--;
    this.selectedItems[index].totalPrice = this.selectedItems[index].quantity * this.selectedItems[index].unitPrice;
    this.validateQuantity(index);
    this.calculateTotalAmount();
  }
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
    orderTime: new Date(),
    note: item.note
  }));

  // Calculate total amount and set various properties
  const totalAmount = this.calculateTotalAmount();
  const currentDate = new Date();
  const customerPaidAmount = this.customerPaid ?? 0; // Default to 0 if customerPaid is null
  const paymentMethodValue = parseInt(this.paymentMethod, 10) ?? 0; // Convert paymentMethod to number

  let amountReceived = totalAmount;
  let returnAmount = 0;

  // Set amountReceived and returnAmount based on payment method
  if (paymentMethodValue === 0) { // Cash
    amountReceived = customerPaidAmount;
    returnAmount = customerPaidAmount - totalAmount;
  } else if (paymentMethodValue === 2) { // COD
    amountReceived = 0;
    returnAmount = 0;
  }

  this.addNew = {
    ...this.addNew, // Spread existing properties if any
    totalAmount,
    orderDetails,
    orderDate: this.getVietnamTime(),
    recevingOrder: currentDate.toISOString(),
    paymentTime: currentDate.toISOString(),
    paymentAmount: totalAmount,
    amountReceived,
    returnAmount,
    paymentMethods: paymentMethodValue,
    description: 'Order payment description',
    discountId: 1,
    taxcode: 'ABCD',
    paymentStatus: 0,
  };

  // Log order details for debugging
  console.log('Order Details:', orderDetails);

  // Call the service to add the new order
  this.orderService.AddNewOrder(this.addNew).subscribe(
    response => {
      console.log('Order created successfully:', response);
      if (response && response.invoiceId) {
        // Fetch the invoice using the returned invoiceId
        this.loadInvoice(response.invoiceId);
      } else {
        console.error('No invoiceId returned from the service.');
      }
      this.successMessage = 'Đơn hàng đã được tạo thành công!';
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

loadInvoice(invoiceId: number): void {
  // Fetch invoice data by ID
  this.invoiceService.getInvoiceById(invoiceId).subscribe(
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
  calculateTotalAmount(): number {
   return this.selectedItems.reduce((total, item) => total + item.totalPrice, 0);
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
    description: ''      // Assuming note is of type string
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
  }
  printInvoice(): void {
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
      </style>
    `);
    printWindow?.document.write('</head><body>');
  
    // Add restaurant information
    printWindow?.document.write(`
      <div class="header">
        <h1>Quán ăn Eating House</h1>
        <p>Địa chỉ: Khu công nghệ cao Hòa Lạc</p>
        <p>Hotline: 0393578176 - 0987654321</p>
        <p>Email: eatinghouse@gmail.com</p>
        <hr>
      </div>
    `);
  
    // Extract the modal-body content
    const modalBodyContent = document.querySelector('#cfpaymentModal .modal-body')?.innerHTML || '';
    printWindow?.document.write(modalBodyContent);
  
    printWindow?.document.write('</body></html>');
    
    // Close the document to finish writing
    printWindow?.document.close();
    
    // Print the content
    printWindow?.focus();
    printWindow?.print();
  }
}
