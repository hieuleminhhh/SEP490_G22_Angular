import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HeaderOrderStaffComponent } from '../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component';
import { SidebarOrderComponent } from "../SidebarOrder/SidebarOrder.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../../service/invoice.service';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { CookingService } from '../../../service/cooking.service';

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
  selectedEmployee: string='';
  employees: any[] = [];

  dateFrom: string = '';
  dateTo: string = '';
  dateNow: string = '';
  selectedEmployeeName: string = '';
  constructor(private invoiceService: InvoiceService,private cookingService: CookingService) { }
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
      },
      error => {
        console.error('Error:', error);

      }
    );
  }
  getOrdersShip(): void {
    this.invoiceService.getOrderShip().subscribe(
      response => {
        this.orderShip = response;
        this.filteredOrders = this.orderShip;
        console.log(this.orderShip);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  filterOrdersByEmployee(): void {
    console.log("Selected Employee ID:", this.selectedEmployee); // Kiểm tra giá trị đã chọn
    if (this.selectedEmployee) {
      // Lọc các đơn hàng theo nhân viên được chọn
      this.filteredOrders = this.orderShip.filter((order: { accountId: number; }) => order.accountId === Number(this.selectedEmployee));
      console.log("Filtered Orders:", this.filteredOrders); // Kiểm tra danh sách đã lọc
    } else {
      // Nếu không có nhân viên nào được chọn, hiển thị tất cả các đơn hàng
      this.filteredOrders = this.orderShip;
    }
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
        this.closeModal(); // Đóng modal sau khi cập nhật xong
        window.location.reload(); // Làm mới trang sau khi thu tiền
      })
      .catch(error => {
        console.error('Error collecting payments:', error);
      });
  }
  update(id: number, totalPaid: number): void {
    const request = {
      paymentAmount: totalPaid
    };

    this.invoiceService.updatePayment(id, request).subscribe(
      response => {
        // Cập nhật trạng thái đơn hàng trong danh sách mà không cần tải lại trang
        this.filteredOrders = this.filteredOrders.filter(order => order.orderId !== id);
        console.log(`Đơn hàng ${id} đã được thu tiền.`);
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
    this.invoiceService.updateOrderStatus(id,request).subscribe(
      response => {
        console.log(response, request);
        window.location.reload();
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
  getOrdersDetail(id:number): void {
    this.invoiceService.getOrderDetail(id).subscribe(
      response => {
        this.selectedItem = response;
      },
      error => {
        console.error('Error:', error);

      }
    );
  }
orderShipper:any;
  getOrderShip(data:any){
    this.orderShipper = data;
  }
}
