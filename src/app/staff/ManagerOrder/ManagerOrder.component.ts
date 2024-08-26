import { Component, OnInit } from '@angular/core';
import { ManagerOrderService } from '../../../service/managerorder.service';
import { ListAllOrder } from '../../../models/order.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerOrderDetailService } from '../../../service/managerorderDetail.service';
import { ListOrderDetailByOrder } from '../../../models/orderDetail.model';
import { SidebarOrderComponent } from "../SidebarOrder/SidebarOrder.component";
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { DateFormatPipe } from '../../common/material/dateFormat/dateFormat.component';
import { HttpErrorResponse } from '@angular/common/http';
import { PercentagePipe } from '../../common/material/percentFormat/percentFormat.component';
import { InvoiceService } from '../../../service/invoice.service';
import { ItemInvoice } from '../../../models/invoice.model';
import { Table } from '../../../models/table.model';
import { AccountService } from '../../../service/account.service';
import { HeaderOrderStaffComponent } from "./HeaderOrderStaff/HeaderOrderStaff.component";

@Component({
    selector: 'app-ManagerOrder',
    templateUrl: './ManagerOrder.component.html',
    styleUrls: ['./ManagerOrder.component.css'],
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, CurrencyFormatPipe, DateFormatPipe, PercentagePipe, HeaderOrderStaffComponent]
})
export class ManagerOrderComponent implements OnInit {
  orders: ListAllOrder[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  dateNow: string = '';
  search: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  selectedOrder: any = {};
  invoice: any = {};
  totalPagesArray: number[] = [];
  weeks: { start: string, end: string }[] = [];
  years: number[] = [];
  accountId: number | null = null;
  account: any;
  statuses = [
    { value: 1, text: 'Đang chờ' },
    { value: 2, text: 'Đã chấp nhận' },
    { value: 3, text: 'Đang phục vụ' },
    { value: 4, text: 'Hoàn thành' },
    { value: 5, text: 'Hủy' },
    { value: 6, text: 'Đang chuẩn bị' },  // Thanh toan Takeaway vs online
    { value: 7, text: 'Đang giao hàng' },
    { value: 8, text: 'Đã hoàn tiền' }  // online
  ];

  types = [
    { value: '1', text: 'Mang về' },//thanh toan trc
    { value: '2', text: 'Online' },// thanh toan trc
    { value: '3', text: 'Đặt bàn' },
    { value: '4', text: 'Tại chỗ' }
  ];
  filterByDate = [
    { value: 'Đặt hàng', text: 'Đặt hàng' },
    { value: 'Giao hàng', text: 'Giao hàng' },
  ];
  selectedStatus: number = 0;
  selectedFilter: string = 'Đặt hàng';
  selectedType: number = 0;
  orderDetail: ListOrderDetailByOrder | null = null;
  orderId: number = 0;
  paymentMethod: string = '0';
  customerPaid: number | null = null;
  paymentAmount: number = 0;
  tables: Table[] = [];
  tableId: number | null = null;
  dishesServed: number = 0;
  totalQuantity: number = 0;
  cancelationReason: string = '';

  constructor(
    private orderService: ManagerOrderService,
    private orderDetailService: ManagerOrderDetailService,
    private router: Router,
    private route: ActivatedRoute,
    private invoiceService : InvoiceService,
    private accountService: AccountService
  ) {}

  ngOnInit() {
    this.setDefaultDates();
    this.selectedType = 0;
    this.loadListOrder();
    this.paymentMethod = '0';
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    this.customerPaid = this.DiscountedTotalAmount();
    console.log('31', this.accountId);
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo = this.formatDate(today);
    this.dateNow = this.formatDate(today);
  }

  setDefaultDates() {
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo = this.formatDate(today);
  }
  getOrder(orderId: number) {
    this.orderDetailService.getOrderDetail(orderId).subscribe(
      (response: ListOrderDetailByOrder) => {
        this.selectedOrder = response;
        console.log('Order details:', this.selectedOrder);
      },
      (error: HttpErrorResponse) => {
        console.error('Error fetching order details:', error);
      }
    );

  }

  loadListOrder(): void {
    this.orderService.ListOrders(
      this.currentPage,
      this.pageSize,
      this.search,
      this.dateFrom,
      this.dateTo,
      this.selectedStatus,
      this.selectedFilter,
      this.selectedType,
    ).subscribe(
      (response: ListAllOrder) => {
        if (response && response.items) {
          this.orders = [response];
          this.totalCount = response.totalCount;
          this.updateTotalPagesArray(response.totalPages);
          console.log('Fetched orders:', this.orders);
        } else {
          console.error('Invalid response:', response);
        }
      },
      (error) => {
        console.error('Error fetching orders:', error);
      }
    );
  }

  loadListOrderDetails(orderId: number) {
    console.log('Loading details for Order ID:', orderId);
    this.orderDetailService.getOrderDetail(orderId).subscribe(
      (orderDetail: ListOrderDetailByOrder) => {
        this.orderDetail = orderDetail;
        this.tables = orderDetail.tables; // Assigning tables to a separate variable

        if (this.tables.length > 0) {
          this.tableId = this.tables[0].tableId; // Extracting tableId from the first table
        }

        // Iterate through orderDetails to access dishesServed and quantity
        let totalDishesServed = 0;
        let totalQuantity = 0;

        orderDetail.orderDetails.forEach((detail) => {
          console.log('Dishes Served:', detail.dishesServed);
          console.log('Quantity:', detail.quantity);
          totalDishesServed += detail.dishesServed; // No need for parseInt
          totalQuantity += detail.quantity; // No need for parseInt
        });

        console.log('Total Dishes Served:', totalDishesServed);
        console.log('Total Quantity:', totalQuantity);

        // Store totalDishesServed and totalQuantity for use in the template
        this.dishesServed = totalDishesServed;
        this.totalQuantity = totalQuantity;

        console.log('Fetched order detail:', this.orderDetail);
        console.log('Tables:', this.tables);
        console.log('Table ID:', this.tableId); // Logging the tableId
      },
      (error) => {
        console.error('Error fetching order detail:', error);
      }
    );
  }




  updateOrder(orderId: number) {
    this.router.navigate(['/updateOrder', orderId]);
  }
  updateTotalPagesArray(totalPages: number): void {
    this.totalPagesArray = Array(totalPages).fill(0).map((x, i) => i + 1);
  }
  DiscountedTotalAmount(): number {
    if (this.orderDetail?.discountPercent && this.orderDetail.discountPercent > 0) {
      const discountAmount = (this.orderDetail.totalAmount * this.orderDetail.discountPercent) / 100;
      return this.orderDetail.totalAmount - discountAmount;
    }
    return this.orderDetail?.totalAmount ?? 0;
  }


  updateOrderStatus(orderId: number, status: number): void {
    this.orderService.UpdateOrderStatus(orderId, status).subscribe(
      (response) => {
        console.log('Order status updated successfully:', response);
        this.loadListOrder();
      },
      (error) => {
        console.error('Error updating order status:', error);
      }
    );
  }



  onStatusChange(event: Event, orderId: number): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedStatus = parseInt(selectElement.value, 10);
    const listOrder = this.orders.find(list => list.items.some(o => o.orderId === orderId));

    if (listOrder) {
      const order = listOrder.items.find(o => o.orderId === orderId);

      if (order) {
        order.status = selectedStatus;
        this.updateOrderStatus(orderId, selectedStatus);
      } else {
        console.error(`Order with orderId ${orderId} not found`);
      }
    } else {
      console.error(`ListAllOrder containing orderId ${orderId} not found`);
    }
  }

  getStatusText(status: number): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj ? statusObj.text : 'Không xác định';
  }

  getStatusColor(status: number): string {
    switch (status) {
      case 1:
        return 'orange';        // Đang chờ
      case 2:
        return 'blue';          // Đã chấp nhận
      case 3:
        return 'purple';       // Đang phục vụ
      case 4:
        return 'teal';         // Hoàn thành
      case 5:
        return 'red';          // Hủy
      case 6:
        return 'brown';        // Đang chuẩn bị
      case 7:
        return 'green';        // Đang giao hàng
      default:
        return 'black';        // Default color
    }
  }



  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadListOrder();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadListOrder();
  }

  navigateToCreateOrder() {
    this.router.navigate(['cuorder']);
  }

  createNewOrder() {
    this.router.navigate(['/cuorder']);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Add leading zero if month is < 10
    const day = ('0' + date.getDate()).slice(-2); // Add leading zero if day is < 10
    return `${year}-${month}-${day}`;
  }



  CreateInvoiceOnline(orderId: number | undefined): void {
    if (orderId != null) { // Check if orderId is neither null nor undefined
      const paymentMethod = parseInt(this.paymentMethod, 10);

      console.log('Payment Method:', paymentMethod);
      console.log('Customer Paid:', this.customerPaid);
      console.log('Discounted Total Amount:', this.DiscountedTotalAmount());

      let amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
      const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - this.DiscountedTotalAmount() : 0;

      console.log('Amount Received:', amountReceived);
      console.log('Return Amount:', returnAmount);

      // Determine paymentStatus based on paymentMethod
      let paymentStatus;
      if (paymentMethod === 0 || paymentMethod === 1) {
        paymentStatus = 1;
      } else if (paymentMethod === 2) {
        paymentStatus = 0;
        amountReceived = 0;
      }

      const updateData = {
        status: 6,
        paymentTime: new Date().toISOString(),
        paymentAmount: this.DiscountedTotalAmount(),
        taxcode: "HIEU",
        accountId: this.accountId,
        amountReceived: amountReceived,
        returnAmount: returnAmount,
        paymentMethods: paymentMethod,
        paymentStatus: paymentStatus,  // Set paymentStatus based on condition
        description: "strizzzg"
      };

      console.log('Update Data:', updateData);

      this.invoiceService.updateStatusAndCreateInvoice(orderId, updateData).subscribe(
        (response) => {
          console.log('Order status updated and invoice created:', response);
          this.loadInvoice(orderId);
        },
        (error: HttpErrorResponse) => {
          console.error('Error updating order status and creating invoice:', error);
        }
      );
    } else {
      console.warn('Order ID is not valid or is undefined.');
    }
  }


  CreateInvoiceTakeAway(orderId: number | undefined): void {
    if (orderId != null) { // Check if orderId is neither null nor undefined
      const paymentMethod = parseInt(this.paymentMethod, 10);

      console.log('Payment Method:', paymentMethod);
      console.log('Customer Paid:', this.customerPaid);
      console.log('Discounted Total Amount:', this.DiscountedTotalAmount());

      const amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
      const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - this.DiscountedTotalAmount() : 0;

      console.log('Amount Received:', amountReceived);
      console.log('Return Amount:', returnAmount);

      const updateData = {
        status: 6,
        paymentTime: new Date().toISOString(),
        paymentAmount: this.DiscountedTotalAmount(),
        taxcode: "HIEU",
        accountId: this.accountId,
        amountReceived: amountReceived,
        returnAmount: returnAmount,
        paymentMethods: paymentMethod,
        paymentStatus: 1,
        description: "strizzzg"
      };

      console.log('Update Data:', updateData);

      this.invoiceService.updateStatusAndCreateInvoice(orderId, updateData).subscribe(
        (response) => {
          console.log('Order status updated and invoice created:', response);
          this.loadInvoice(orderId);
        },
        (error: HttpErrorResponse) => {
          console.error('Error updating order status and creating invoice:', error);
        }
      );
    } else {
      console.warn('Order ID is not valid or is undefined.');
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
  reloadPage() {
    window.location.reload(); // Reloads the current page
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
          .qr-code-container img {
            width: 75px; /* Adjust size as needed */
            height: 75px;
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
        ${this.invoice?.discountPercent && this.invoice.discountPercent > 0 ? `
        <div class="mb-3">
          <label for="discount" class="form-label">Khuyến mãi:</label>
          <span id="discount">
            ${this.getDiscountInvoiceAmount().toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })} (${this.invoice.discountPercent}%)
          </span>
        </div>
        <hr>
        <div class="mb-3">
          <label for="totalAmount" class="form-label">Tổng tiền:</label>
          <span id="totalAmount">${this.invoice?.paymentAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
        </div>` : ''}
        ${(this.paymentMethod === '0' || this.paymentMethod === '1' && this.invoice?.deposits === 0) ? `
        <div class="mb-3">
          <label for="prepay" class="form-label">Thanh toán trước:</label>
          <span id="prepay">${this.invoice?.deposits.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
        </div>` : ''}
        ${(this.paymentMethod === '0' || this.paymentMethod === '1' && this.invoice?.deposits !== 0) ? `
        <div class="mb-3">
          <label for="additionalPayment" class="form-label">Tiền khách phải trả thêm:</label>
          <span id="additionalPayment">
            ${(this.invoice?.paymentAmount - this.invoice?.deposits).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
          </span>
        </div>` : ''}
        <hr>
        ${this.paymentMethod === '0' ? `
        <div class="mb-3">
          <label for="customerPaid" class="form-label">Tiền khách đưa:</label>
          <span id="customerPaid">${this.invoice?.amountReceived.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
        </div>
        <div class="mb-3">
          <label for="changeToGive" class="form-label">Trả lại:</label>
          <span id="changeToGive">${this.invoice?.returnAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
        </div>` : ''}
        ${this.paymentMethod === '1' ? `
        <div class="mb-3 qr-code-container">
          <img id="qrCodePrepay" src="https://th.bing.com/th/id/OIP.SzaQ2zk5Q5EsnORQ_zpvGAHaHa?w=202&h=202&c=7&r=0&o=5&dpr=1.3&pid=1.7" alt="QR Code" class="img-fluid">
        </div>` : ''}
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
      setTimeout(() => {
        printWindow?.print();
      }, 1000); // 1 second delay
    } else {
      console.error('Invoice ID is not defined.');
    }
  }

  // UpdateStatus(orderId: number | undefined, status: number | undefined) {
  //   if (orderId !== undefined && status !== undefined) {
  //     this.orderService.updateOrderStatus(orderId, status).subscribe(
  //       response => {
  //         window.location.reload();
  //         console.log('Invoice status updated successfully:', response);
  //         // Handle the plain text response, e.g., show a success message
  //       },
  //       error => {
  //         console.error('Error updating invoice status:', error);
  //         // Handle the error response
  //       }
  //     );
  //   } else {
  //     console.error('Order ID or status is undefined');
  //   }
  // }

  CancelOrderReason(orderId: number | undefined) {
    if (orderId !== undefined) {
        const cancelationReason = this.cancelationReason;

        if (cancelationReason) {
            const cancelationData = {
                cancelationReason: cancelationReason
            };

            this.orderService.CancelOrder(orderId, cancelationData).subscribe(
                response => {
                    window.location.reload();
                    console.log('Invoice status updated successfully:', response);
                },
                error => {
                    console.error('Error updating invoice status:', error);
                }
            );
        } else {
            console.error('Cancelation reason is required');
        }
    } else {
        console.error('Order ID is undefined');
    }
}


  getDiscountOrderAmount(): number {
    if (this.orderDetail?.totalAmount && this.orderDetail?.discountPercent) {
      return (this.orderDetail.totalAmount * this.orderDetail.discountPercent) / 100;
    }
    return 0;
  }
  getDiscountInvoiceAmount(): number {
    if (this.invoice?.totalAmount && this.invoice?.discountPercent) {
      return (this.invoice.totalAmount * this.invoice.discountPercent) / 100;
    }
    return 0;
  }
  //Online thanh toan khi nhan hang
  updateAmountReceiving(orderId: number | undefined) {
    const paymentMethod = parseInt(this.paymentMethod, 10);
    // Create the data object with the required properties
    const amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
    const data = {
      status: 4,
      amountReceived: amountReceived,
      description: "Hieu Update"
    };

    if (orderId !== undefined) {
      this.orderService.updateAmountReceiving(orderId, data).subscribe(
        response => {
          window.location.reload();
          console.log('Amount received and status updated successfully:', response);
          // Handle the response, e.g., show a success message
        },
        error => {
          console.error('Error updating amount received and status:', error);
          // Handle the error response
        }
      );
    } else {
      console.error('Order ID is undefined');
    }
  }
  //Offline thanh toan truoc
  PrePayment(orderId: number | undefined) {
    const paymentMethod = parseInt(this.paymentMethod, 10);

    console.log('Payment Method:', paymentMethod);
    console.log('Customer Paid:', this.customerPaid);
    console.log('Discounted Total Amount:', this.DiscountedTotalAmount());

    let amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
    const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - this.DiscountedTotalAmount() : 0;

    console.log('Amount Received:', amountReceived);
    console.log('Return Amount:', returnAmount);
    if (orderId !== undefined) {
      const data = {
        deposits: this.DiscountedTotalAmount(),
        paymentTime: new Date().toISOString(), // Automatically sets the current date and time
        paymentAmount: this.DiscountedTotalAmount(),
        taxcode: "string",
        paymentStatus: 2,
        accountId: this.accountId,
        amountReceived: amountReceived,
        returnAmount: returnAmount,
        paymentMethods: paymentMethod,
        description: "Hieu Update",
      };

      this.invoiceService.updateDepositAndCreateInvoice(orderId, data).subscribe(
        response => {
          console.log('Order and invoice updated successfully:', response);
          this.loadInvoice(orderId);
        },
        error => {
          console.error('Error updating order and invoice:', error);
        }
      );
    } else {
      console.error('Invoice ID is undefined');
    }
  }
  getAmountDue(): number {
    if (!this.orderDetail) {
      return 0; // Or handle it appropriately
    }
    const discountedTotal = this.DiscountedTotalAmount();
    const deposits = this.orderDetail.deposits || 0;
    return discountedTotal - deposits;
  }
  getFinalAmountDue(): number {
    const totalAmount = this.DiscountedTotalAmount();
    const deposit = this.orderDetail?.deposits || 0;
    return totalAmount - deposit;
  }
  isCustomerPaidValid: boolean = true;
  validateCustomerPaid() {
    const amountDue = this.DiscountedTotalAmount(); // Get the amount due after considering deposits and discounts
    const customerPaidValue = this.customerPaid ?? 0; // Default to 0 if customerPaid is null

    if (customerPaidValue < amountDue) {
      console.error('Tiền khách trả không được nhỏ hơn tổng tiền đơn hàng.');
      this.isCustomerPaidValid = false; // Disable input if validation fails

      // Optionally reset the value if invalid
      if (this.customerPaid !== null) {
        this.customerPaid = null; // or you can set it to the minimum value
      }
    } else {
      this.isCustomerPaidValid = true; // Enable input if validation passes
    }
  }



  //Offline hoan thanh goi them mon

  SuscessfullOrderOffline(orderId: number | undefined, invoiceId?: number) {

    const paymentMethod = parseInt(this.paymentMethod, 10);

    console.log('Payment Method:', paymentMethod);
    console.log('Customer Paid:', this.customerPaid);
    console.log('Discounted Total Amount:', this.DiscountedTotalAmount());

    if (orderId !== undefined) {
      if (invoiceId === undefined || invoiceId === 0 || invoiceId === null) {
        // Create a new invoice
        let amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
        const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - this.DiscountedTotalAmount() : 0;
        const createData = {
          orderId: orderId,
          paymentTime: new Date().toISOString(),
          paymentAmount: this.DiscountedTotalAmount(),
          taxcode: "XYZDEW",
          paymentStatus: 1,
          customerName: "New Customer",
          amountReceived: amountReceived,
          returnAmount: returnAmount,
          paymentMethods: paymentMethod,
          accountId: this.accountId,
          description: "Invoice Created"
        };

        this.invoiceService.createInvoiceOffline(orderId, createData).subscribe(
          response => {
            console.log('Invoice created successfully:', response);
            this.loadInvoice(orderId);
            // Additional handling on success
          },
          error => {
            console.error('Error creating invoice:', error);
            // Handle the error response
          }
        );
      } else {
        // Update an existing invoice
        const remainingAmountDue = this.getAmountDue();
        console.log('Remaining Amount Due:', remainingAmountDue);

        let amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
        console.log('Amount Received:', amountReceived);

        const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - remainingAmountDue : 0;
        console.log('Return Amount:', returnAmount);

        const updateData = {
          status: 4,
          paymentTime: new Date().toISOString(),
          paymentAmount: this.DiscountedTotalAmount(),
          taxcode: "XYZDEW",
          paymentStatus: 1,
          amountReceived: amountReceived,
          returnAmount: returnAmount,
          paymentMethods: paymentMethod,
          description: "Invoice Updated",
          tableStatus: 0,
        };

        this.invoiceService.updateOrderAndInvoice(orderId, updateData).subscribe(
          response => {
            console.log('Invoice updated successfully:', response);
            this.loadInvoice(orderId);
            // Additional handling on success
          },
          error => {
            console.error('Error updating invoice:', error);
            // Handle the error response
          }
        );
      }
    } else {
      console.error('Order ID is undefined');
    }
  }

  acceptOrder(orderId: number | undefined): void {
    if (orderId !== undefined) {
      const data = {
        paymentAmount: 0,
        taxcode: "string",
        accountId: 0,
        amountReceived: 0,
        returnAmount: 0,
        paymentMethods: 2,
        description: "string"
      };

      this.orderService.AcceptOrderWaiting(orderId, data).subscribe(
        response => {
          window.location.reload();
          console.log('Order accepted successfully:', response);

        },
        error => {
          console.error('Error accepting order:', error);
          // Xử lý khi gọi API thất bại, ví dụ: hiển thị thông báo lỗi
        }
      );
    } else {
      console.error('Order ID is undefined');
      // Xử lý khi `orderId` không xác định
    }
  }

  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;
        console.log('Account details:', this.account);
        console.log('Account role:', this.account.role);

      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  getTablesAsString(): string {
    if (this.orderDetail?.tables && this.orderDetail.tables.length > 0) {
      return this.orderDetail.tables.map(table => table.tableId).join(', ');
    }
    return '';
  }
  onDateFromChange(): void {

    this.onSearch();
  }

  onDateToChange(): void {
    if (this.dateTo < this.dateFrom) {
      this.dateFrom = this.dateTo;
    }
    this.onSearch();
  }
}
