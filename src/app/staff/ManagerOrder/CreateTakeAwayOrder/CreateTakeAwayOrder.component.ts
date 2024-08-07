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

@Component({
  selector: 'app-CreateTakeAwayOrder',
  templateUrl: './CreateTakeAwayOrder.component.html',
  styleUrls: ['./CreateTakeAwayOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, CurrencyFormatPipe, DateFormatPipe, PercentagePipe]
})
export class CreateTakeAwayOrderComponent implements OnInit {

  constructor(private router: Router, private dishService: ManagerDishService, private comboService: ManagerComboService,
     private orderService : ManagerOrderService,  private cd: ChangeDetectorRef, private invoiceService: InvoiceService,
    private route: ActivatedRoute, private dialog: MatDialog, private discountService: DiscountService) { }
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
    description: ''
  };
  lastOrderId: number | undefined;
  newAddress: AddNewAddress = {
    guestAddress: 'Ăn tại quán',
    consigneeName: '',
    guestPhone: '',
    email:'antaiquan@gmail.com',
  };
  ngOnInit() {
    this.loadListDishes();
    this.loadListCombo();
    this.loadAddresses();
    this.selectedAddress = "Khách lẻ"
    this.selectCategory('Món chính');
    this.LoadActiveDiscounts();
    this.calculateAndSetTotalAmount();
    this.selectedDiscount = null;

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
  }

  showCombos() {
    this.showingCombos = !this.showingCombos;
    this.showingDishes = false;
    this.showingCombos = true;
    this.searchCategory = ''; 
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
    this.successMessage = "Tất cả các mặt hàng đã được xóa khỏi giỏ hàng.";
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
    this.addNew.email = 'antaiquan@gmail.com';
    this.addNew.guestAddress = 'Ăn tại quán'; 
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
         <span id="discount">${this.getDiscountAmount()} (${this.invoice?.discountPercent || '0'}%)</span>
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
  filterAddresses() {
    const lowerCaseSearchTerm = this.searchTerm.toLowerCase();
    this.filteredAddresses = this.addresses.filter(address => 
      address.consigneeName.toLowerCase().includes(lowerCaseSearchTerm) || 
      address.guestPhone.includes(this.searchTerm)
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
  LoadActiveDiscounts(): void {
    this.discountService.getActiveDiscounts().subscribe((data) => {
      this.discount = data;
    }, (error) => {
      console.error('Error fetching active discounts:', error);
    });
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
  const totalAmount = this.selectedDiscount ? this.totalAmountAfterDiscount : this.calculateTotalAmount();
  const currentDate = new Date();
  const customerPaidAmount = this.customerPaid ?? 0; // Default to 0 if customerPaid is null
  const paymentMethodValue = parseInt(this.paymentMethod, 10) ?? 0; // Convert paymentMethod to number

  this.addNew = {
    ...this.addNew, // Spread existing properties if any
    totalAmount,
    orderDetails,
    orderDate: this.getVietnamTime(),
    recevingOrder: currentDate.toISOString(),
    paymentTime: currentDate.toISOString(),
    amountReceived: paymentMethodValue === 0 ? customerPaidAmount : totalAmount,
    returnAmount: paymentMethodValue === 0 ? customerPaidAmount - totalAmount : 0,
    paymentMethods: paymentMethodValue,
    description: 'Order payment description',
    discountId: this.selectedDiscount,
    taxcode: '',
    paymentStatus: 1,
  };

  // Handle address selection
  if (this.selectedAddress !== 'Khách lẻ') {
    const parts = this.selectedAddress.split(' - ');
    if (parts.length >= 2) {
      this.addNew.consigneeName = parts[0];
      this.addNew.guestPhone = parts[1];
    } else {
      console.error('Selected address format is incorrect.');
    }
    this.addNew.email = 'antaiquan@gmail.com';
    this.addNew.guestAddress = 'Ăn tại quán';
  }

  // Log order details for debugging
  console.log('Order Details:', orderDetails);

  // Call the service to add the new order
  this.orderService.AddNewOrder(this.addNew).subscribe(
    response => {
      console.log('Order created successfully:', response);
      this.successMessage = 'Đơn hàng đã được tạo thành công!';
      this.lastOrderId = response.orderId; // Assuming the response contains the orderId
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
    
    console.log('Order ID:', this.lastOrderId);
    console.log('Payment Method:', paymentMethod);
    console.log('Customer Paid:', this.customerPaid);
    console.log('Discounted Total Amount:', totalAmount);

    const amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : totalAmount;
    const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - totalAmount : 0;

    console.log('Amount Received:', amountReceived);
    console.log('Return Amount:', returnAmount);

    const updateData = {
      status: 6,
      paymentTime: new Date().toISOString(),
      paymentAmount: totalAmount,
      taxcode: "HIEU",
      accountId: 0,
      amountReceived: amountReceived,
      returnAmount: returnAmount,
      paymentMethods: paymentMethod,
      description: "strizzzg"
    };

    console.log('Update Data:', updateData);

    this.invoiceService.updateStatusAndCreateInvoice(this.lastOrderId, updateData).subscribe(
      (response) => {
        console.log('Order status updated and invoice created:', response);
        this.loadInvoice(this.lastOrderId!);
      },
      (error) => {
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
  
}
