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
import { HeaderOrderStaffComponent } from "../HeaderOrderStaff/HeaderOrderStaff.component";
import { NotificationService } from '../../../../service/notification.service';
import { Title } from '@angular/platform-browser';
import { CategoryService } from '../../../../service/category.service';
@Component({
  selector: 'app-UpdateOrderForGuest',
  templateUrl: './UpdateOrderForGuest.component.html',
  styleUrls: ['./UpdateOrderForGuest.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, CurrencyFormatPipe, DateFormatPipe, PercentagePipe, HeaderOrderStaffComponent]
})
export class UpdateOrderForGuestComponent implements OnInit {

  constructor(private router: Router, private orderService: ManagerOrderService, private route: ActivatedRoute, private dishService: ManagerDishService,
    private comboService: ManagerComboService, private notificationService: NotificationService, private orderDetailService: ManagerOrderDetailService, private invoiceService: InvoiceService, private discountService: DiscountService,
    private checkoutService: CheckoutService, private titleService: Title, private categoryService: CategoryService) { }
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
    email: 'antaiquan@gmail.com',
  };
  showSidebar: boolean = true;
  customerPaid: number | null = null;
  addressId: number | null = null;
  addNew: any = {};
  dbItems: any[] = []; // Added dbItems property
  newlyAddedItems: any[] = [];
  invoice: any = {};
  initialTotalAmount: number = 0;
  orderIdForUpdate: any;
  private socket!: WebSocket;
  private reservationQueue: any[] = [];
  ngOnInit() {
    this.titleService.setTitle('Cập nhật đơn | Eating House');
    this.getAllCategories();
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
    console.log('AAAA' + this.selectedDiscount);
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
      this.loadListDishes(this.searchCategory, this.search);
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
    this.newAddress = { consigneeName: '', guestPhone: '', guestAddress: '', email: '' };
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
      const maxQuantity = this.getMaxQuantity(item);

      // Check if the current quantity is already at the maximum
      if (item.quantity < maxQuantity) {
        item.quantity++;
        this.updateTotalPrice(index, orderId);
        this.addOrUpdateNewlyAddedItem(item);
      } else {
        console.warn(`Cannot increase quantity for item ${item.dishId || item.comboId}. Maximum quantity is ${maxQuantity}.`);
      }
    }
  }



  decreaseQuantity(index: number, orderId: number): void {
    const item = this.selectedItems[index];
    if (item) {
      // Fetch the order detail within the method
      this.orderDetailService.getOrderDetail(orderId).subscribe((orderDetail) => {
        // Find the specific detail for the item in question, using either dishId or comboId
        const detail = orderDetail.orderDetails.find((d: any) =>
          (item.dishId && d.dishId === item.dishId) ||
          (item.comboId && d.comboId === item.comboId)
        );

        if (detail) {
          // Check if decreasing the quantity would result in a quantity less than dishesServed
          const maxAllowedDecrease = item.quantity - detail.dishesServed;

          if (maxAllowedDecrease <= 0) {
            console.log('Cannot decrease quantity below the number of dishes served.');
            return; // Prevent decreasing the quantity if it would be less than dishesServed
          }

          // Decrease the quantity if it's valid to do so
          item.quantity--;
          this.updateTotalPrice(index, orderId);
          this.removeOrUpdateNewlyAddedItem(item);
        }
      });
    }
  }


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

      // Check if the item already exists in newlyAddedItems
      const selectedItemIndex = this.newlyAddedItems.findIndex(selectedItem =>
        this.itemsAreEqual(selectedItem, item)
      );

      console.log("Index in newlyAddedItems:", selectedItemIndex);
      console.log("This new:", this.newlyAddedItems);

      const unitPrice = item.discountedPrice ? item.discountedPrice : item.price;

      if (selectedItemIndex !== -1) {
        console.log('selectedItems', this.newlyAddedItems);
        console.log('currentQuantities:', currentQuantities);

        // Item already exists in newlyAddedItems, update the quantity
        const newQuantity = item.quantity;
        const initialQuantity = currentQuantity; // Quantity in the database

        // Check if the selectedItem exists in the array before updating
        if (this.newlyAddedItems[selectedItemIndex]) {
          this.newlyAddedItems[selectedItemIndex].quantity = newQuantity - initialQuantity;
          this.newlyAddedItems[selectedItemIndex].totalPrice = this.newlyAddedItems[selectedItemIndex].quantity * unitPrice;
        } else {
          console.error('Error: selectedItemIndex points to an undefined item in newlyAddedItems.');
        }
      } else {
        // Item is new, add to newlyAddedItems
        const newItem = {
          ...item,
          quantity: item.quantity - currentQuantity, // Only add the new quantity
          unitPrice: unitPrice,
          totalPrice: (item.quantity - currentQuantity) * unitPrice
        };
        this.newlyAddedItems.push(newItem);
      }

      console.log('Updated Newly Added Items:', this.newlyAddedItems);
    } catch (error) {
      console.error('Error updating newly added items:', error);
    }

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
      // Lấy số lượng tối đa từ hàm getMaxQuantity
      const maxQuantity = this.getMaxQuantity(item);

      // Giới hạn số lượng trong khoảng từ 1 đến maxQuantity
      item.quantity = Math.max(1, Math.min(item.quantity, maxQuantity));

      // Cập nhật giá tiền và tổng số lượng
      this.updateTotalPrice(index, orderId);
    }
  }
  async addItem(item: any) {
    // Find if the item already exists in selectedItems
    const index = this.selectedItems.findIndex(selectedItem => this.itemsAreEqual(selectedItem, item));

    // Determine the maximum allowable quantity based on item type
    const maxQuantity = this.getMaxQuantity(item);

    // Ensure unitPrice is a valid number
    let unitPrice = item.discountedPrice ? item.discountedPrice : item.price;
    if (isNaN(unitPrice)) {
      console.error('Unit price is not a number:', unitPrice);
      unitPrice = 0; // Ensure unitPrice has a valid number
    }

    if (index !== -1) {
      // If the item already exists, check if we can increase its quantity
      if (this.selectedItems[index].quantity < maxQuantity) {
        this.selectedItems[index].quantity++;
        this.selectedItems[index].totalPrice = this.selectedItems[index].quantity * unitPrice;
      } else {
        // Show an error message if the quantity exceeds the available stock
        this.errorMessage = 'Không thể thêm món này nữa, số lượng đã đạt giới hạn.';
        this.clearErrorMessageAfterTimeout();
        return; // Exit the method early
      }
    } else {
      // If the item does not exist, add it to selectedItems with quantity 1 and set the total price
      if (item.quantityDish > 0 || item.quantityCombo > 0) { // Ensure there is stock available
        this.selectedItems.push({
          ...item,
          quantity: 1,
          unitPrice: unitPrice,
          totalPrice: unitPrice,
          dishesServed: 0
        });
      } else {
        // Show an error message if the item is out of stock
        this.errorMessage = 'Món này đã hết hàng.';
        this.clearErrorMessageAfterTimeout();
        return; // Exit the method early
      }
    }

    console.log('Updated Selected Items:', this.selectedItems);

    // Recalculate totalAmount and totalAmountAfterDiscount after adding item
    this.calculateAndSetTotalAmount();

    // Find the specific item in newlyAddedItems
    const newlyAddedIndex = this.newlyAddedItems.findIndex(newlyAddedItem => this.itemsAreEqual(newlyAddedItem, item));

    if (newlyAddedIndex !== -1) {
      // If the item already exists in newlyAddedItems, update its quantity
      if (this.newlyAddedItems[newlyAddedIndex].quantity < maxQuantity) {
        this.newlyAddedItems[newlyAddedIndex].quantity += 1;
        this.newlyAddedItems[newlyAddedIndex].totalPrice = this.newlyAddedItems[newlyAddedIndex].quantity * unitPrice;
      } else {
        // Show an error message if the quantity exceeds the available stock
        this.errorMessage = 'Không thể thêm món này nữa, số lượng đã đạt giới hạn.';
        this.clearErrorMessageAfterTimeout();
        return; // Exit the method early
      }
    } else {
      // If the item does not exist in newlyAddedItems, add it with the correct quantity
      if (item.quantityDish > 0 || item.quantityCombo > 0) { // Ensure there is stock available
        this.newlyAddedItems.push({
          ...item,
          quantity: 1,
          unitPrice: unitPrice,
          totalPrice: unitPrice,
        });
      } else {
        // Show an error message if the item is out of stock
        this.errorMessage = 'Món này đã hết hàng.';
        this.clearErrorMessageAfterTimeout();
        return; // Exit the method early
      }
    }

    console.log('Updated Newly Added Items:', this.newlyAddedItems);
  }
  clearErrorMessageAfterTimeout() {
    setTimeout(() => {
      this.errorMessage = '';  // Clear the message after 5 seconds
    }, 2000);  // 5000 milliseconds = 5 seconds
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
    console.log(discountPercent);
    this.totalAmountAfterDiscount = this.totalAmount * (1 - discountPercent / 100);
    console.log("Total Amount After Discount:", this.totalAmountAfterDiscount);
  }

  removeItem(index: number, orderId: number): void {
    const removedItem = this.selectedItems[index];
    console.log('Attempting to remove/decrease item:', removedItem);

    // Check if the item exists in the cart (newlyAddedItems) but not yet saved
    const cartIndex = this.newlyAddedItems.findIndex(item => this.itemsAreEqual(item, removedItem));

    // If the item is in the cart (newlyAddedItems) and not saved to the database yet
    if (cartIndex !== -1) {
      // Remove the item directly from newlyAddedItems
      this.newlyAddedItems.splice(cartIndex, 1);
      console.log('Item removed from newlyAddedItems:', this.newlyAddedItems);

      // Remove the item from selectedItems as well
      this.selectedItems.splice(index, 1);
      console.log('Item removed from selectedItems:', this.selectedItems);

      // Update total price after removing the item
      this.updateTotalPrice(index, orderId);

      return; // Exit the method after handling the cart removal
    }
    // If the item is not in the cart (newlyAddedItems), proceed with the regular removal process
    this.orderDetailService.getOrderDetail(orderId).subscribe((orderDetail) => {
      // Find the specific detail for the item using either dishId or comboId
      const detail = orderDetail.orderDetails.find((d: any) =>
        (removedItem.dishId && d.dishId === removedItem.dishId) ||
        (removedItem.comboId && d.comboId === removedItem.comboId)
      );

      if (detail) {
        // Calculate the maximum allowed decrease based on the difference between quantity and dishesServed
        const maxAllowedDecrease = removedItem.quantity - detail.dishesServed;

        if (maxAllowedDecrease <= 0) {
          console.log('Cannot remove or decrease quantity below the number of dishes served.');
          return; // Prevent removal if it would violate the dishesServed constraint
        }

        // Decrease the quantity to the dishesServed count
        removedItem.quantity = detail.dishesServed;
        console.log('Quantity decreased to dishesServed count:', removedItem.quantity);

        // Update total price after decreasing the quantity
        this.updateTotalPrice(index, orderId);

        // Update or remove the item in newlyAddedItems
        this.removeOrUpdateNewlyAddedItem(removedItem);

        // Remove the item from selectedItems if its quantity is 0 or less
        if (removedItem.quantity <= 0) {
          this.selectedItems.splice(index, 1);
          console.log('Item removed from selectedItems:', this.selectedItems);
        }
      }
    });
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

        console.log(648, this.discounts);

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
    this.orderIdForUpdate = orderId;
    this.orderDetailService.getOrderDetail(orderId).subscribe(
      (response: ListOrderDetailByOrder) => {
        this.selectedOrder = response;
        this.selectedItems = response.orderDetails;
        if (response.discountId) {
          this.selectedDiscount = response.discountId;
          console.log('640,' + this.selectedDiscount);
          const discount = this.discounts.find(d => d.discountId === response.discountId);


          if (discount) {
            this.selectedDiscountName = discount.discountName;
            this.selectedDiscountPercent = discount.discountPercent;
            this.calculateAndSetTotalAmount();
          }
        }

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
        this.createNotification(orderId);
        this.updateOrderDetail(this.orderIdForUpdate);
        // Clear newlyAddedItems after successful update
        this.newlyAddedItems = [];
        this.selectCategory('Món chính');


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

  updateOrderDetail(orderId: number) {
    console.log(orderId);

    this.orderService.updateOrderDetail(orderId).subscribe(
      response => {
        console.log(response);
      },
      (error: HttpErrorResponse) => {
        console.error('Error updating offline order:', error);
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
