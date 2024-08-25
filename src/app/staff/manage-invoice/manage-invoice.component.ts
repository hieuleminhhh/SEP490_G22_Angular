import { Component, OnInit } from '@angular/core';
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
  constructor(private invoiceService: InvoiceService,private cookingService: CookingService) { }

  ngOnInit() {
    this.selectTab('overview');
    this.getOrdersCancel();
    this.getOrdersShip();
    this.getOrdersStatic();
    this.getEmployees();
  }
  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  getOrdersStatic(): void {
    this.invoiceService.getStatistics().subscribe(
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
        this.filteredOrders = this.orderShip; // Khởi tạo danh sách đã lọc bằng tất cả đơn hàng
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
    // Kiểm tra nếu có nhân viên được chọn
    if (this.selectedEmployee) {
      // Tính tổng số tiền cho đơn hàng của nhân viên đã chọn
      return this.filteredOrders
        .filter(order => order.accountIdId === Number(this.selectedEmployee)) // Lọc theo nhân viên
        .reduce((total, order) => total + (order.totalPaid || 0), 0);
    } else {
      // Tính tổng số tiền cho tất cả các đơn hàng
      return this.filteredOrders.reduce((total, order) => total + (order.totalPaid || 0), 0);
    }
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
  update(id: number,totalPaid:number): void {
    const request = {
      paymentAmount: totalPaid
    }
    this.invoiceService.updatePayment(id,request).subscribe(
      response => {
       window.location.reload();

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
}
