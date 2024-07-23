import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-CreateTakeAwayOrder',
  templateUrl: './CreateTakeAwayOrder.component.html',
  styleUrls: ['./CreateTakeAwayOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent]
})
export class CreateTakeAwayOrderComponent implements OnInit {

  constructor(private router: Router, private dishService: ManagerDishService, private comboService: ManagerComboService,
     private orderService : ManagerOrderService,  private cd: ChangeDetectorRef, private invoiceService: InvoiceService, private route: ActivatedRoute,) { }
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

    // Recalculate totalAmount after adding item
    this.calculateTotalAmount();
  }
  clearCart() {
    this.selectedItems = [];
    this.selectedAddress = "Khách lẻ"
    this.selectCategory('Món chính');
    this.successMessage = "Tất cả các mặt hàng đã được xóa khỏi giỏ hàng.";
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
    comboId: item.comboId
  }));

  // Calculate total amount and set various properties
  const totalAmount = this.calculateTotalAmount();
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
    paymentAmount: totalAmount,
    amountReceived: paymentMethodValue === 0 ? customerPaidAmount : totalAmount,
    returnAmount: paymentMethodValue === 0 ? customerPaidAmount - totalAmount : 0,
    paymentMethods: paymentMethodValue,
    description: 'Order payment description',
    discountId: 1,
    taxcode: 'ABCD',
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

}
