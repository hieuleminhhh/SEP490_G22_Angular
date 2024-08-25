import { Component, OnInit } from '@angular/core';
import { TableService } from '../../../../service/table.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarOrderComponent } from "../../SidebarOrder/SidebarOrder.component";
import { AccountService } from '../../../../service/account.service';
import { JwtInterceptor } from '../../../../jwt.interceptor';
import { HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { HeaderOrderStaffComponent } from '../HeaderOrderStaff/HeaderOrderStaff.component';
import { ManagerOrderService } from '../../../../service/managerorder.service';

@Component({
  selector: 'app-ViewTableOrder',
  templateUrl: './ViewTableOrder.component.html',
  styleUrls: ['./ViewTableOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, HeaderOrderStaffComponent],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ]

})
export class ViewTableOrderComponent implements OnInit {
  tables: any[] = [];
  originalDataTable: any[] = [];
  currentView: string = 'table-layout';
  selectedFloor = 1;
  selectedTable: string = 'all';
  dataTable: any;
  accountId: number | null = null;
  account: any;
  orderId: any;
  showSidebar: boolean = true;
  tableId: number = 0;

  constructor(private tableService: TableService, private router: Router,
    private route: ActivatedRoute, private accountService: AccountService,
    private orderService: ManagerOrderService) { }

  ngOnInit() {

    // Retrieve accountId from localStorage and convert to number
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;

    console.log('31', this.accountId);

    if (this.accountId) {
      this.getAccountDetails(this.accountId);
      this.getTableData();
    } else {
      console.error('Account ID is not available');
    }
  }
  getTableData(): void {
    this.tableService.getTables().subscribe(
      response => {
        this.originalDataTable = response; // Lưu dữ liệu ban đầu
        this.dataTable = [...this.originalDataTable];
        this.filterTablesByFloorAndStatus(this.selectedTable);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  getFloors(): number[] {
    const uniqueFloors = new Set<number>();
    this.originalDataTable.forEach(table => {
      uniqueFloors.add(table.floor);
    });
    return Array.from(uniqueFloors).sort((a, b) => a - b);
  }
  getTableOFFloor(floor: number) {
    this.selectedFloor = floor;
    this.filterTablesByFloorAndStatus(this.selectedTable);
  }

  getTableOFFloorEmpty(floor: any): void {
    this.selectedFloor = parseInt(floor, 10);
    this.dataTable = this.originalDataTable.filter(table => table.floor === this.selectedFloor && table.status === 0);
  }
  filterTablesByFloorAndStatus(selectedTable: string): void {
    const currentFloor = this.selectedFloor;
    if (selectedTable === 'all') {
      // Nếu chọn 'all', hiển thị tất cả các bàn của tầng đang chọn
      this.dataTable = this.originalDataTable.filter(table => table.floor === currentFloor);
    } else if (selectedTable === 'empty') {
      // Nếu chọn 'empty', chỉ hiển thị các bàn trống của tầng đang chọn
      this.dataTable = this.originalDataTable.filter(table => table.floor === currentFloor && table.status === 0);
    }
  }
  navigateToOrder(tableId: number, status: number): void {
    this.loadOrderIdByTable(tableId ,status);
}
  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;
        console.log('Account details:', this.account);
        console.log('Account role:', this.account.role);
        this.showSidebar = this.account.role !== 'OrderStaff';

      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  loadOrderIdByTable(tableId: number, status: number): void {
    console.log('Loading orders for table ID:', tableId);
    this.orderService.getOrdersByTableId(tableId).subscribe(
      (response: any) => {
        if (response && response.data) {
          this.orderId = response.data.orderId;
          console.log('Test order ID:', this.orderId);
        } else {
          console.error('Invalid response:', response);
          this.orderId = null;

          // Điều hướng vào `else` khi response không hợp lệ
          if (status === 0) {
            this.router.navigate(['/createOffline'], { queryParams: { tableId } });
          } else if (status === 1) {
            this.router.navigate(['/createOffline'], { queryParams: { tableId } });
          }
          return; // Dừng thực hiện các khối điều kiện tiếp theo
        }

        // Điều hướng dựa trên orderId và status
        if (status === 0) {
          this.router.navigate(['/createOffline'], { queryParams: { tableId, orderId: this.orderId } });
        }else if (status === 1 && this.orderId !== null) {
          this.router.navigate(['/updateOffline'], { queryParams: { tableId } });
        } else if (status === 1 && this.orderId === null) {
          this.router.navigate(['/createOffline'], { queryParams: { tableId, orderId: this.orderId } });
        }
      },
      (error: HttpErrorResponse) => {
        console.error('Error fetching orders:', error);

        // Xử lý lỗi và điều hướng vào else
        this.orderId = null;
        if (status === 0) {
          this.router.navigate(['/createOffline'], { queryParams: { tableId } });
        } else if (status === 1) {
          this.router.navigate(['/createOffline'], { queryParams: { tableId } });
        }
      }
    );
  }

}
