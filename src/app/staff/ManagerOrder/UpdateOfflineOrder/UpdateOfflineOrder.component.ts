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
import { CurrencyFormatPipe } from '../../../common/material/currencyFormat/currencyFormat.component';
import { DateFormatPipe } from '../../../common/material/dateFormat/dateFormat.component';
import { ItemInvoice } from '../../../../models/invoice.model';
import { Discount } from '../../../../models/discount.model';
import { PercentagePipe } from '../../../common/material/percentFormat/percentFormat.component';
import { DiscountService } from '../../../../service/discount.service';
@Component({
  selector: 'app-UpdateOfflineOrder',
  templateUrl: './UpdateOfflineOrder.component.html',
  styleUrls: ['./UpdateOfflineOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, CurrencyFormatPipe, DateFormatPipe, PercentagePipe]
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
  constructor(private router: Router, private orderService: ManagerOrderService, private route: ActivatedRoute,  private dishService: ManagerDishService,
     private comboService: ManagerComboService,private orderDetailService: ManagerOrderDetailService, private invoiceService : InvoiceService, private discountService: DiscountService ) { }
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
    this.LoadActiveDiscounts();
    this.calculateAndSetTotalAmount();
    this.selectedDiscount = null;
    
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
      } else {
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
  
  
  
  itemsAreEqual(item1: any, item2: any): boolean {
    return (item1.dishId === item2.dishId && item1.comboId === item2.comboId);
  }

  
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

updateOrderOffline(tableId: number): void {
  // Extract newly added items to update in the DB
  const orderDetails = this.newlyAddedItems.map(item => ({
      dishId: item.dishId || null,
      comboId: item.comboId || null,
      quantity: item.quantity,
      note: item.note || '', // Assuming you have a note property or set it to an empty string
      orderTime: new Date().toISOString() // Assuming you want the current time
  }));

  // Log the data before sending
  console.log('Updating offline order with newly added items:', orderDetails);

  // Construct the order object
  const updatedOrder = {
      tableId: tableId,
      discountId: this.selectedDiscount || 0,
      orderDetails: orderDetails
  };

  // Call the service method to update the order
  this.orderService.updateOrderOffline(tableId, updatedOrder).subscribe(
      response => {
          console.log('Offline order updated successfully:', response);
          this.successMessage = 'Offline order updated successfully!';
          this.closeModal();
          setTimeout(() => this.successMessage = '', 5000);
          window.location.reload();
          // Clear newlyAddedItems after successful update
          this.newlyAddedItems = [];
      },
      (error: HttpErrorResponse) => {
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
          this.LoadActiveDiscountByOrderID(this.orderId);
          console.log(428,this.orderId);
          this.calculateAndSetTotalAmount();
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
  cancelOrderForTable(tableId: number): void {
    const status = 5; 
    this.orderService.CancelOrderForTable(tableId, status).subscribe(
      response => {
        this.closeModal();
        console.log('Order canceled successfully:', response);
        this.router.navigate(['/listTable']); 
      },
      error => {
        console.error('Error canceling order:', error);
      }
    );
  }
  closeAndRedirect(): void {
    this.router.navigate(['/listTable']);
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
            <span id="orderDate">${this.invoice?.orderDate}</span>
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
             <span id="discount">${this.invoice?.discountName || '0'} (${this.invoice?.discountPercent || '0' }}%)</span>
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
    onItemClick(discount: Discount) {
      this.selectedDiscount = discount.discountId;
      this.selectedDiscountName = discount.discountName;
      this.selectedDiscountPercent = discount.discountPercent;
      console.log('Discount selected:', this.selectedDiscount);
    }  
    LoadActiveDiscounts(): void {
      this.discountService.getActiveDiscounts().subscribe((data) => {
        this.discounts = data;
        this.applyExistingDiscount();
      }, (error) => {
        console.error('Error fetching active discounts:', error);
      });
    }
    applyExistingDiscount(): void {
      if (this.selectedDiscount !== null) {
        const discount = this.discounts.find(d => d.discountId === this.selectedDiscount);
        if (discount) {
          this.selectedDiscountName = discount.discountName;
          this.selectedDiscountPercent = discount.discountPercent;
          this.calculateTotalAmountAfterDiscount();
        }
      }
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
    applyDiscount(): void {
      if (this.selectedDiscount !== null) {
        // Find the selected discount
        const discount = this.discounts.find((d: Discount) => d.discountId === this.selectedDiscount);
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
    
    
    
  }
  
  
