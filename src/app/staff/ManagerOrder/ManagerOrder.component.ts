import { Component, OnInit } from '@angular/core';
import { ManagerOrderService } from '../../../service/managerorder.service';
import { ListAllOrder } from '../../../models/order.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
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

@Component({
    selector: 'app-ManagerOrder',
    templateUrl: './ManagerOrder.component.html',
    styleUrls: ['./ManagerOrder.component.css'],
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, CurrencyFormatPipe, DateFormatPipe, PercentagePipe]
})
export class ManagerOrderComponent implements OnInit {
  orders: ListAllOrder[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  search: string = '';  
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  selectedOrder: any = {};
  invoice: any = {};
  totalPagesArray: number[] = [];
  weeks: { start: string, end: string }[] = [];
  years: number[] = [];

  statuses = [
    { value: 1, text: 'Đang chờ' },
    { value: 2, text: 'Đã chấp nhận' },
    { value: 3, text: 'Đang phục vụ' },
    { value: 4, text: 'Hoàn thành' },
    { value: 5, text: 'Hủy' },
    { value: 6, text: 'Đang chuẩn bị' },  // Thanh toan Takeaway vs online
    { value: 7, text: 'Đang giao hàng' }   // online
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

  constructor(
    private orderService: ManagerOrderService, 
    private orderDetailService: ManagerOrderDetailService, 
    private router: Router,
    private route: ActivatedRoute,
    private invoiceService : InvoiceService
  ) {}

  ngOnInit() {
    this.setDefaultDates();
    this.loadListOrder();
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
        // Thực hiện logic bổ sung nếu cần
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
      (orderDetail) => {
        this.orderDetail = orderDetail;
        this.tables = orderDetail.tables; // Assigning tables to a separate variable
        if (this.tables.length > 0) {
          this.tableId = this.tables[0].tableId; // Extracting tableId from the first table
        }
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
    return this.orderDetail?.totalAmount ?? 0; // Sử dụng giá trị mặc định nếu orderDetail là null
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
  areAllDishesServedEqualToQuantity(): boolean {
    if (!this.orderDetail || !this.orderDetail.orderDetails) {
      return false;
    }
    return this.orderDetail.orderDetails.every(item => Number(item.dishesServed) === item.quantity);
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
        return 'orange';
      case 2:
        return 'blue';
      case 3:
        return 'purple';
      case 4:
        return 'teal';
      case 5:
        return 'red';
      default:
        return 'black';
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
  SuscessfullCreateInvoice(orderId: number | undefined): void {
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
        status: 4,
        paymentTime: new Date().toISOString(),
        paymentAmount: this.DiscountedTotalAmount(),
        taxcode: "HIEU",
        accountId: 0,
        amountReceived: amountReceived,
        returnAmount: returnAmount,
        paymentMethods: paymentMethod,
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
  
  PrePaymentCreateInvoice(orderId: number | undefined): void {
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
        status: 2,
        paymentTime: new Date().toISOString(),
        paymentAmount: this.DiscountedTotalAmount(),
        taxcode: "HIEU",
        accountId: 0,
        amountReceived: amountReceived,
        returnAmount: returnAmount,
        paymentMethods: paymentMethod,
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
  
  
  

}
