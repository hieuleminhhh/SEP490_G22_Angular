import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HeaderOrderStaffComponent } from '../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component';
import { SidebarOrderComponent } from "../SidebarOrder/SidebarOrder.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../../service/invoice.service';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { CookingService } from '../../../service/cooking.service';
import { ExportService } from '../../../service/export.service';

interface OrderDetail {
  orderDetailId: any;
  dishName: string;
  unitPrice: number;
  quantity: number;
  dishesServed: any; // Hoặc kiểu khác nếu biết rõ
}

interface OrderInfo {
  orderId: any;
  orderDate: string;
  status: string;
  recevingOrder: string;
  totalAmount: number;
  guestPhone: string;
  deposits: number;
  note: string;
  cancelationReason: string;
  invoiceId: any;
  paymentTime: string;
  paymentAmount: number;
  taxcode: string;
  paymentStatus: string;
  customerName: string;
  invoicePhone: string;
  invoiceAddress: string;
  addressId: any;
  guestAddress: string;
  consigneeName: string;
  guestEmail: string;
  orderDetails: OrderDetail[]; // Định nghĩa kiểu cho mảng orderDetails
}

@Component({
  selector: 'app-manage-invoice',
  templateUrl: './manage-invoice.component.html',
  styleUrls: ['./manage-invoice.component.css'],
  standalone: true,
  imports: [HeaderOrderStaffComponent, SidebarOrderComponent, FormsModule, CommonModule, CurrencyFormatPipe]
})
export class ManageInvoiceComponent implements OnInit {
  selectedTab: string = 'overview';
  data: any;
  orderCancel: any;
  orderShip: any;
  selectedItem: any;

  filteredOrders: any[] = [];
  selectedEmployee: string = '';
  employees: any[] = [];

  dateFrom: string = '';
  dateTo: string = '';
  dateNow: string = '';
  selectedEmployeeName: string = '';
  orders: any;
  accountId: any;
  selectedStatusFun: string | null = null;

  constructor(private invoiceService: InvoiceService, private cookingService: CookingService, private exportService: ExportService) { }
  @ViewChild('collectAllModal') collectAllModal!: ElementRef;
  ngOnInit() {
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo = this.formatDate(today);
    this.dateNow = this.formatDate(today);
    this.selectTab('overview');
    this.getOrdersCancel();
    this.getOrdersShip();
    this.getOrdersStatic();
    this.getEmployees();
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    this.selectedStatus = 'unpaid';
    this.selectedStatusFun = 'unrefun';
  }
  selectTab(tab: string) {
    this.selectedTab = tab;
  }
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  onDateFromChange(): void {

    this.getOrdersStatic();
  }

  onDateToChange(): void {
    if (this.dateTo < this.dateFrom) {
      this.dateFrom = this.dateTo;
    }
    this.getOrdersStatic();
  }

  getOrdersStatic(): void {
    this.invoiceService.getStatistics(this.dateFrom, this.dateTo).subscribe(
      response => {
        this.data = response;
      },
      error => {
        console.error('Error:', error);

      }
    );
  }
  getOrdersCancel(): void {
    this.invoiceService.getCancelOrder().subscribe(
      response => {
        this.orderCancel = response;
        console.log(response);
        if (this.selectedStatusFun) {
          this.filterOrdersByStatus(this.selectedStatusFun);
        } else {
          console.log("No status selected.");
        }
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  filterOrdersByStatus(status: string | null = ''): void {
    this.selectedStatus = status;
    if (status === 'unrefun') {
      this.filteredOrders = this.orderCancel.filter((order: { status: number; }) => order.status === 5);
    } else if (status === 'refun') {
      this.filteredOrders = this.orderCancel.filter((order: { status: number; }) => order.status === 8);
    } else {
      this.filteredOrders = this.orderCancel;
    }

    console.log("Filtered Orders by Status:", this.filteredOrders);
  }
  getOrdersShip(): void {
    this.invoiceService.getOrderShip().subscribe(
      response => {
        this.orderShip = response;
        this.filterOrders();
        console.log(this.orderShip);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  selectedStatus: string | null = null;
  filterOrders(): void {
    console.log("Selected Employee ID:", this.selectedEmployee);
    this.filteredOrders = this.orderShip;

    if (this.selectedEmployee) {
      this.filteredOrders = this.filteredOrders.filter(
        (order: { staffId: number }) => order.staffId === Number(this.selectedEmployee)
      );
    }

    if (this.selectedStatus) {
      if (this.selectedStatus === 'paid') {
        this.filteredOrders = this.filteredOrders.filter(
          (order: { paymentStatus: number }) => order.paymentStatus === 1
        );
      } else if (this.selectedStatus === 'unpaid') {
        this.filteredOrders = this.filteredOrders.filter(
          (order: { paymentStatus: number }) => order.paymentStatus === 0
        );
      }
    }

    console.log("Filtered Orders:", this.filteredOrders);
  }

  totalAmountDue(): number {
    // Tổng số tiền sẽ dựa trên danh sách đã lọc
    return this.filteredOrders.reduce((total, order) => total + (order.totalPaid || 0), 0);
  }

  getEmployees(): void {
    // Giả định bạn có một service để lấy danh sách nhân viên từ server
    this.cookingService.getShipStaff().subscribe(
      response => {
        this.employees = response;
        console.log(this.employees);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  prepareCollectAllModal(): void {
    const selectedEmployee = this.employees.find(emp => emp.accountId === Number(this.selectedEmployee));
    if (selectedEmployee) {
      this.selectedEmployeeName = `${selectedEmployee.firstName} ${selectedEmployee.lastName}`;
      console.log(this.selectedEmployeeName);

    }
  }

  // Mở modal
  openModal(): void {
    const modal = this.collectAllModal.nativeElement;
    modal.classList.add('show');
    modal.style.display = 'block';
    modal.setAttribute('aria-modal', 'true');
    modal.removeAttribute('aria-hidden');
  }

  // Đóng modal
  closeModal(): void {
    const modal = this.collectAllModal.nativeElement;
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
  }

  // Xác nhận thu tất cả
  collectAllPayments(): void {
    const updatePromises = this.filteredOrders.map(order =>
      new Promise<void>((resolve, reject) => {
        this.update(order.orderId, order.totalPaid);
        resolve(); // Hoàn tất promise ngay lập tức (có thể thêm logic kiểm tra ở đây)
      })
    );

    Promise.all(updatePromises)
      .then(() => {
        this.closeModal();
        window.location.reload();
      })
      .catch(error => {
        console.error('Error collecting payments:', error);
      });
  }

  update(id: number, totalPaid: number): void {
    const request = {
      paymentAmount: totalPaid,
      collectedBy: this.accountId
    };

    this.invoiceService.updatePayment(id, request).subscribe(
      response => {
        this.filteredOrders = this.filteredOrders.filter(order => order.orderId !== id);
        console.log(`Đơn hàng ${id} đã được thu tiền.`);
        this.getOrdersShip();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }


  updateOrderStatus(id: number): void {
    const request = {
      status: 8
    }
    this.invoiceService.updateOrderStatus(id, request).subscribe(
      response => {
        console.log(response, request);
        const body = {
          orderId: id,
          staffId: this.accountId
        }
        this.invoiceService.updateStaffId(body).subscribe(
          response => {
          },
          error => {
            console.error('Error:', error);
          }
        );
        this.getOrdersCancel();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  showDetails(order: any) {
    console.log(order);
    this.getOrdersDetail(order);
  }

  closePopup() {
    this.selectedItem = null;
  }
  getOrdersDetail(id: number): void {
    this.invoiceService.getOrderDetail(id).subscribe(
      response => {
        this.selectedItem = response;
      },
      error => {
        console.error('Error:', error);

      }
    );
  }
  orderShipper: any;
  getOrderShip(data: any) {
    this.orderShipper = data;
  }
  orderCancelMoney: any;
  getOrderCancel(data: any) {
    this.orderCancelMoney = data;
  }
  exportData(): void {
    this.getOrderExport();
  }

  getOrderExport(): void {
    this.invoiceService.getOrderExport(this.data.orderIds).subscribe(
      response => {
        const flattenedData = this.flattenOrderData(response);
        console.log(flattenedData); // Kiểm tra dữ liệu đã bao gồm orderDetail chưa
        this.exportService.exportToExcel(flattenedData, 'orders');
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  flattenOrderData(orders: any[]): any[] {
    const flattenedData: any[] = [];

    orders.forEach(order => {
      const orderInfo = {
        orderId: order.orderId,
        orderDate: this.formatDateTime(order.orderDate),
        status: "Hoàn thành",
        recevingOrder: this.formatDateTime(order.recevingOrder),
        totalAmount: order.totalAmount,
        guestPhone: order.guestPhone,
        deposits: order.deposits,
        note: order.note,
        cancelationReason: order.cancelationReason,
        invoiceId: order.invoice?.invoiceId,
        paymentTime: this.formatDateTime(order.invoice?.paymentTime),
        paymentAmount: order.invoice?.paymentAmount,
        taxcode: order.invoice?.taxcode,
        paymentStatus: order.invoice?.paymentStatus,
        customerName: order.invoice?.customerName,
        invoicePhone: order.invoice?.phone,
        invoiceAddress: order.invoice?.address,
        addressId: order.address?.addressId,
        guestAddress: order.address?.guestAddress,
        consigneeName: order.address?.consigneeName,
        guestEmail: order.guest?.email,
      };

      // Lặp qua từng chi tiết đơn hàng và kết hợp với thông tin đơn hàng
      order.orderDetails.forEach((detail: { orderDetailId: any; dishName: string; unitPrice: number; quantity: number; dishesServed: any; }) => {
        flattenedData.push({
          ...orderInfo, // Gộp thông tin đơn hàng
          orderDetailId: detail.orderDetailId,
          dishName: detail.dishName,
          unitPrice: detail.unitPrice,
          quantity: detail.quantity,
          dishesServed: detail.dishesServed
        });
      });
    });

    return flattenedData;
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Không sử dụng định dạng 12 giờ
    });
  }

}
