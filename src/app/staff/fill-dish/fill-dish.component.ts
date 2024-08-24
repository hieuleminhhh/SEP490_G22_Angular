import { CookingService } from './../../../service/cooking.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { switchMap } from 'rxjs';
import { HeaderOrderStaffComponent } from "../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";
import { DateFormatPipe } from '../../common/material/dateFormat/dateFormat.component';

@Component({
  selector: 'app-fill-dish',
  standalone: true,
  templateUrl: './fill-dish.component.html',
  styleUrls: ['./fill-dish.component.css'],
  imports: [CommonModule, FormsModule, CurrencyFormatPipe, HeaderOrderStaffComponent, DateFormatPipe]
})
export class FillDishComponent implements OnInit {

  filteredOrders: any[] = [];
  selectedOrder: any = null;
  selectedOrders: any[] = [];
  orderDish: any;
  selectedButton: 'dineIn' | 'takeAway' | 'ship' = 'dineIn';
  quantitiesServed: number[] = [];
  ordersTakeaway: any;
  selectedItem: any;
  isInputValid: boolean[] = [];
  deliveryOrders: any[] = [];
  takeawayOrders: any[] = [];
  dataShipStaff: any;
  isAnyOrderSelected: boolean = false;
  isPrinted: boolean = false;
  constructor(private cookingService: CookingService) { }

  ngOnInit(): void {
    this.getCompletedDishesFromLocalStorage();
    this.getOrdersTakeaway();
    this.getShipStaff();
  }

  getCompletedDishesFromLocalStorage(): void {
    const storedCompletedDishes = localStorage.getItem('completedDishes');
    if (storedCompletedDishes) {
      const parsedOrders = JSON.parse(storedCompletedDishes);
      this.filteredOrders = this.groupOrdersByName(parsedOrders);
    } else {
      this.filteredOrders = [];
    }
  }
  groupOrdersByName(orders: any[]): any[] {
    const groupedOrders: { [key: string]: any } = {};

    orders.forEach(order => {
      const name = order.itemNameOrComboName;
      if (!groupedOrders[name]) {
        groupedOrders[name] = { ...order };
      } else {
        groupedOrders[name].dishesServed += order.dishesServed;
      }
    });

    return Object.values(groupedOrders);
  }
  onCheckboxChange(selectedOrder: any, event: any): void {
    if (event.target.checked) {
      // Deselect all other orders
      this.filteredOrders.forEach(order => {
        if (order !== selectedOrder) {
          order.selected = false;
        }
      });
      this.selectedOrder = selectedOrder; // Lưu order được chọn

      this.getOrderDish(selectedOrder.itemNameOrComboName, selectedOrder.dishesServed); // Gọi hàm để lấy dữ liệu của order
    } else {
      this.selectedOrder = null;
      this.orderDish = null;
    }
  }
  getOrderDish(key: string, dishesServed: number) {
    this.cookingService.getOrdersDish(key).subscribe(
      response => {
        this.orderDish = response;
        console.log(this.orderDish);

        this.quantitiesServed = []; // Khởi tạo mảng quantitiesServed mới mỗi khi gọi hàm

        this.orderDish.forEach((dish: { quantityRequired: number; }, index: number) => {
          if (dish.quantityRequired >= dishesServed) {
            this.quantitiesServed[index] = dishesServed;
          } else {
            this.quantitiesServed[index] = dish.quantityRequired;
          }
        });
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  

  getOrderTimeHoursMinutes(orderTime: string): string {
    const date = new Date(orderTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  updateDishesServed(orderDetailId: number, itemNameOrComboName: string) {
    const index = this.orderDish.findIndex((dish: { orderDetailId: number; }) => dish.orderDetailId === orderDetailId);

    if (index !== -1) {
      const quantityServedForDish = this.quantitiesServed[index]; // Lấy số lượng phục vụ cho món ăn cụ thể

      const request = {
        orderDetailId: orderDetailId,
        dishesServed: quantityServedForDish
      };
      this.cookingService.updateDishesServed(request).subscribe(
        response => {
          console.log(response);
          console.log(itemNameOrComboName);
          this.deleteLocalStorageItemsByName(itemNameOrComboName);
          const a = this.getDishesServedByName(itemNameOrComboName) - quantityServedForDish;
          if (a > 0) {
            this.updateLocal(orderDetailId, a, itemNameOrComboName);
          }

          window.location.reload();
        },
        error => {
          console.error('Error:', error);
        }
      );
    } else {
      console.error('Error: Order detail ID not found.');
    }
  }

  getDishesServedByName(itemNameOrComboName: string): number {
    const order = this.filteredOrders.find(order => order.itemNameOrComboName === itemNameOrComboName);
    return order ? order.dishesServed : 0;
  }

  deleteLocalStorageItemsByName(name: string): void {
    const value = localStorage.getItem('completedDishes');

    if (value) {
      const items = JSON.parse(value);
      if (Array.isArray(items)) {
        const updatedItems = items.filter((item: any) => !item.itemNameOrComboName.includes(name));
        if (updatedItems.length !== items.length) {
          localStorage.setItem('completedDishes', JSON.stringify(updatedItems));
          console.log(`Deleted items with name containing '${name}'`);
        } else {
          console.log(`No items found with name containing '${name}'`);
        }
      }
    } else {
      console.log('No completedDishes found in localStorage');
    }

    // In lại các mục trong completedDishes sau khi xóa
    console.log('Remaining completedDishes:', localStorage.getItem('completedDishes'));
  }

  private updateLocal(orderDetailId: number, dishesServed: number, itemNameOrComboName: string): void {
    let completedDishes = JSON.parse(localStorage.getItem('completedDishes') || '[]');
    completedDishes.push({ orderDetailId, dishesServed, itemNameOrComboName });
    localStorage.setItem('completedDishes', JSON.stringify(completedDishes));

    console.log('Completed Dishes:', localStorage.getItem('completedDishes'));
  }


  onButtonClick(buttonType: 'dineIn' | 'takeAway' | 'ship'): void {
    this.selectedButton = buttonType;
  }

  isSelected(buttonType: 'dineIn' | 'takeAway' | 'ship'): boolean {
    return this.selectedButton === buttonType;
  }

  getOrdersTakeaway() {
    this.cookingService.getOrdersTakeaway().subscribe(
      response => {
        this.ordersTakeaway = response;
        this.takeawayOrders = this.ordersTakeaway.filter((order: { orderType: number; }) => order.orderType === 1);
        this.deliveryOrders = this.ordersTakeaway.filter((order: { orderType: number; }) => order.orderType === 2);

        console.log('Đơn mang về:', this.takeawayOrders);
        console.log('Đơn giao hàng:', this.deliveryOrders);

      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  handleButtonClick(order: any) {
    const request = {
      status: 4
    };

    this.cookingService.updateOrderStatus(order.orderId, request).subscribe(
      response => {
        console.log('Order status updated:', response);
        this.selectedButton = 'takeAway';
        this.refreshContent();
      },
      error => {
        console.error('Error:', error);
      }
    );
    console.log('Button clicked for order:', order);
  }

  refreshContent() {
    if (this.selectedButton === 'takeAway') {
      this.getOrdersTakeaway();
    }
    if (this.selectedButton === 'ship') {
      this.getOrdersTakeaway();
    }

  }
  closeModal(index: number) {

  }

  showDetails(order: any) {
    console.log(order);
    this.selectedItem = order;
  }

  closePopup() {
    this.selectedItem = null;
  }

  preventNonNumericalInput(event: KeyboardEvent): void {
    const charCode = event.charCode;
    if (charCode !== 8 && charCode !== 0 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  validateInput(event: Event, index: number, maxQuantity: number): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;

    const numericValue = Number(value);

    if (
      !value ||
      numericValue < 1 ||
      numericValue > maxQuantity ||
      isNaN(numericValue)
    ) {
      this.isInputValid[index] = false;
      inputElement.setCustomValidity('Giá trị không hợp lệ');
    } else {
      this.isInputValid[index] = true;
      inputElement.setCustomValidity('');
    }

    inputElement.reportValidity();
  }

  getShipStaff() {
    this.cookingService.getShipStaff().subscribe(
      response => {
        this.dataShipStaff = response;
        console.log(this.dataShipStaff);

      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  updateAccountId(aId: any) {
    const request1 = {
      status: 7
    };
    const request2 = {
      accountId: aId
    }
    console.log(aId);

    this.selectedOrders.forEach(order => {
      // Gọi API để cập nhật accountId cho đơn hàng
      this.cookingService.updateAccountForOrder(order.orderId, request2).pipe(
        // Khi cập nhật accountId thành công, cập nhật trạng thái đơn hàng lên 7
        switchMap(response => {
          console.log(`Order ${order.orderId} account updated successfully`, response);
          return this.cookingService.updateOrderStatus(order.orderId, request1);
        })
      ).subscribe(
        statusResponse => {
          console.log(`Order ${order.orderId} status updated to 7 successfully`, statusResponse);
        },
        error => {
          console.error(`Error updating account or status for order ${order.orderId}:`, error);
        }
      );

    });
  }



  assignShipButtonClick(order: any) {

    this.cookingService.updateOrderStatus(order.orderId, status).subscribe(
      response => {
        console.log('Order status updated:', response);
        this.selectedButton = 'takeAway';
        this.refreshContent();
      },
      error => {
        console.error('Error:', error);
      }
    );
    console.log('Button clicked for order:', order);
  }

  onCheckBoxChange(selectedOrder: any, event: any): void {
    if (event.target.checked) {
      if (!this.selectedOrders.includes(selectedOrder)) {
        this.selectedOrders.push(selectedOrder);
      }
      this.getOrderDish(selectedOrder.itemNameOrComboName, selectedOrder.dishesServed);
    } else {
      const index = this.selectedOrders.indexOf(selectedOrder);
      if (index > -1) {
        this.selectedOrders.splice(index, 1);
      }
      if (this.selectedOrders.length === 0) {
        this.orderDish = null;
      }
    }
    console.log(this.selectedOrders);

  }
  printOrder(): void {
    const modalElement = document.getElementById('invoiceModal');
    if (modalElement) {
        // Create a copy of the modal to work with
        const printElement = modalElement.cloneNode(true) as HTMLElement;

        // Remove unnecessary elements from the copy
        const headerToRemove = printElement.querySelector('.text-center.mb-3');
        if (headerToRemove) headerToRemove.remove();

        // Remove all elements with class 'card-header d-flex justify-content-center'
        const cardHeaders = printElement.querySelectorAll('.card-header.d-flex.justify-content-center');
        cardHeaders.forEach(header => header.remove());

        // Remove all buttons inside 'card-header' elements
        const buttonsToRemove = printElement.querySelectorAll('button');
        buttonsToRemove.forEach(button => button.remove());

        let printContents = printElement.innerHTML;

        // Open a new window for printing
        const printWindow = window.open('', '', 'width=100mm,height=150mm');

        if (printWindow) {
            // Write the content to the new window
            printWindow.document.write('<html><head><title>Print Order</title>');
            printWindow.document.write(`
                <style>
                    @media print {
                        @page {
                            size: 100mm 150mm;
                            margin: 0;
                        }
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            width: 100mm;
                            height: 150mm;
                            box-sizing: border-box;
                        }
                        .header {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            background: #fff;
                            padding: 2mm;
                            width: 100%;
                            box-sizing: border-box;
                            height: 20mm;
                            text-align: center;
                        }
                        .footer {
                            position: fixed;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            background: #fff;
                            padding: 2mm;
                            width: 100%;
                            box-sizing: border-box;
                            height: 10mm;
                            text-align: center;
                        }
                        .content {
                            margin: 30mm 2mm 20mm 2mm;
                            overflow: hidden;
                        }
                        .page-break {
                            page-break-before: always;
                        }
                        .order {
                            page-break-inside: avoid;
                        }
                        .content > div {
                            margin-bottom: 5mm;
                        }
                    }
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 5mm;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 14px;
                    }
                    .header p {
                        margin: 1px 0;
                    }
                    hr {
                        margin: 5mm 0;
                        border: 0;
                        border-top: 1px solid #000;
                    }
                    .table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 5mm;
                    }
                    .table th, .table td {
                        border: 1px solid #ddd;
                        padding: 4px;
                        text-align: left;
                        font-size: 12px;
                    }
                    .table th {
                        background-color: #f2f2f2;
                    }
                    .text-right {
                        text-align: right;
                    }
                </style>
            `);
            printWindow.document.write('</head><body>');

            // Add restaurant information header
            printWindow.document.write(`
                <div class="header">
                    <h1>Eating House</h1>
                    <p>Địa chỉ: Khu công nghệ cao Hòa Lạc</p>
                    <p>Hotline: 0393578176 - 0987654321</p>
                    <p>Email: eatinghouse@gmail.com</p>
                    <hr>
                </div>
            `);

            // Add the content of the modal with page breaks for each order
            printWindow.document.write('<div class="content">');
            const orders = Array.from(printElement.querySelectorAll('.card1'));
            orders.forEach((order, index) => {
                if (index > 0) {
                    printWindow.document.write('<div class="page-break"></div>');
                }
                printWindow.document.write(order.outerHTML);
            });
            printWindow.document.write('</div>');

            // Add footer without border
            printWindow.document.write(`
                <div class="footer">
                    Cảm ơn quý khách và hẹn gặp lại!
                </div>
            `);

            // Close the document and trigger print
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
            this.isPrinted = true;
        }
    } else {
        console.error('Modal element not found.');
    }
}
reloadPage(): void {
  window.location.reload();
  }


}