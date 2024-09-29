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
import { Title } from '@angular/platform-browser';

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
  selectedFloor: string = '';
  selectedTable: string = 'all';
  dataTable: any;
  accountId: number | null = null;
  account: any;
  orderId: any;
  showSidebar: boolean = true;
  tableId: number = 0;
  selectedTables: number[] = [];

  constructor(private tableService: TableService, private router: Router,
    private route: ActivatedRoute, private accountService: AccountService,
    private orderService: ManagerOrderService, private titleService: Title) { }

  ngOnInit() {
    this.titleService.setTitle('Danh sách bàn | Eating House');
    // Retrieve accountId from localStorage and convert to number
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;

    console.log('31', this.accountId);
    this.getTableData();
    if (this.accountId) {
      this.getAccountDetails(this.accountId);

    } else {
      console.error('Account ID is not available');
    }
  }
  getTableData(): void {
    this.tableService.getTables().subscribe(
      response => {
        this.originalDataTable = response; // Lưu dữ liệu ban đầu
        this.selectedFloor = this.originalDataTable[0].floor;
        this.dataTable = [...this.originalDataTable];
        this.filterTablesByFloorAndStatus(this.selectedTable);
        console.log(this.dataTable);

      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  getFloors(): string[] {
    const uniqueFloors = new Set<string>();

    if (Array.isArray(this.originalDataTable)) {
      this.originalDataTable.forEach(table => {
        if (table.floor !== null && table.floor !== undefined) { // Kiểm tra giá trị null hoặc undefined
          uniqueFloors.add(table.floor);
        }
      });
    } else {
      console.error('originalDataTable is not an array:', this.originalDataTable);
    }

    return Array.from(uniqueFloors).sort(); // Sắp xếp chuỗi thay vì số
  }
  getTableOFFloor(floor: string) {
    this.selectedFloor = floor;
    this.filterTablesByFloorAndStatus(this.selectedTable);
  }
  filterTablesByFloorAndStatus(selectedTable: string): void {
    const currentFloor = this.selectedFloor;
    const currentTime = new Date();
    this.dataTable = this.originalDataTable.filter(table => {
      let isAvailable = true;

      if (selectedTable === 'all') {
        if (table.floor === currentFloor) {
          if (table.tableReservations.length > 0) {
            for (let reservation of table.tableReservations) {
              const reservationTime = new Date(reservation.reservationTime); // Chuyển đổi thời gian đặt thành dạng Date
              const timeDifference = (reservationTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60); // Chênh lệch thời gian theo giờ
              if (timeDifference < 3 && timeDifference > 0) {
                isAvailable = false; // Nếu có đặt chỗ cách hiện tại < 3 tiếng, đặt bàn là không sẵn sàng
                break; // Dừng vòng lặp
              }
            }
          }
          // Gán biến isAvailable vào mỗi bàn
          table.isAvailable = isAvailable;
          return true;
        }
      } else if (selectedTable === 'empty') {
        // Nếu chọn 'empty', chỉ kiểm tra các bàn trống
        if (table.floor === currentFloor && table.status === 0) {
          if (table.tableReservations.length > 0) {
            for (let reservation of table.tableReservations) {
              const reservationTime = new Date(reservation.reservationTime);
              const timeDifference = (reservationTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
              if (timeDifference < 3 && timeDifference > 0) {
                isAvailable = false;
                break;
              }
            }
          }
          // Gán biến isAvailable cho mỗi bàn
          table.isAvailable = isAvailable;
          return isAvailable;
        }
      }
      return false;
    });
  }

  navigateToOrder(tableId: number, status: number, isAvailable?:any): void {
    if(isAvailable===true){
      this.loadOrderIdByTable(tableId, status);
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
        } else if (status === 1 && this.orderId !== null) {
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
  onTableSelect(tableId: number): void {
    if (this.selectedTables.includes(tableId)) {
      // If the table is already selected, remove it
      this.selectedTables = this.selectedTables.filter(id => id !== tableId);
    } else {
      // If the table is not selected, add it
      this.selectedTables.push(tableId);
    }
  }

  // Method to handle submission of selected tables
  submitSelectedTables(): void {
    if (this.selectedTables.length > 0) {
      this.selectedTables.forEach(tableId => {
        // Tạo đơn hàng cho bàn trống (status = 0)
        this.navigateToOrder(tableId, 0);
      });
    } else {
      console.error('No tables selected');
    }
  }
  isModalVisible: boolean = false;
  isModalVisibles: boolean = false;
  selectedReservations: any[] = [];
  openModalSchedule(reservations: any, event: MouseEvent) {
    event.stopPropagation();  // Prevent the event from propagating to the parent element
    // Logic to open the modal
    this.selectedReservations = reservations; // Set reservations for the modal
    this.isModalVisibles = true; // Show modal
  }
  // Function to close the modal
  closeModalSchedule() {
    this.isModalVisibles = false; // Hide modal
  }
  closeModal(): void {
    this.isModalVisible = false;
    this.isModalVisibles = false;
  }
}
