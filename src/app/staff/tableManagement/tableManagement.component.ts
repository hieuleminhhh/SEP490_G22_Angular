import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableService } from '../../../service/table.service';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ReservationService } from '../../../service/reservation.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { BehaviorSubject, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Table, TableReservationResponse } from '../../../models/table.model';
import { DatePipe } from '@angular/common';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { HeaderOrderStaffComponent } from '../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component';


@Component({
  selector: 'app-tableManagement',
  standalone: true,
  templateUrl: './tableManagement.component.html',
  styleUrls: ['./tableManagement.component.css'],
  imports: [CommonModule, FormsModule, NgxPaginationModule, CurrencyFormatPipe, HeaderOrderStaffComponent],
  providers: [DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TableManagementComponent implements OnInit {

  currentView: string = 'table-layout';
  dataTable: any;
  originalDataTable: Table[] = [];
  dataReservationAccept: any;
  dataReservationToday: any;
  selectedTime: string = 'today';
  dataReservationPending: any;
  reservationDetail: any;
  showDropdown = false;
  selectedTable: string = 'all';
  selectedFloor = 1;
  selectedTableIds: number[] = [];
  dataReservation: any;
  reservationTimeSelected: string | undefined;
  reserId: number | undefined;


  tabs: string[] = ['Tất cả',  '', 'Chưa nhận bàn','Đã nhận bàn', 'Đã hoàn thành','Đã hủy'];
  selectedIndex: number = 0;
  searchTerm: string = '';
  searchTermSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');

  currentPage = 1; // Trang hiện tại
  itemsPerPage = 9; // Số bản ghi trên mỗi trang
  totalItems = 0; // Tổng số bản ghi

  dateFrom: string = '';
  dateTo: string = '';
  dateNow: string = '';
  dateString: string = '';
  currentReservationId: number | undefined;
  errorMessage: string = '';
  errorMessages: { [key: number]: string } = {};
  constructor(private tableService: TableService, private reservationService: ReservationService, private router: Router) { }

  ngOnInit(): void {
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo = this.formatDate(today);
    this.dateNow = this.formatDate(today);
    this.dateString = this.dateNow.toString();
    this.getTableData();
    this.searchTermSubject.pipe(debounceTime(300)).subscribe(searchTerm => {
      this.getSearchList();
    });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  setView(view: string) {
    this.currentView = view;
  }
  toggleDropdown(index: number): void {
    this.dataReservationAccept.forEach((reservation: any, i: number) => {
      reservation.isDropdownOpen = (i === index) ? !reservation.isDropdownOpen : false;
    });
  }
  tableDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event) {
    if (!(event.target as HTMLElement).closest('.dropdown')) {
      if (this.dataReservationAccept && Array.isArray(this.dataReservationAccept)) {
        this.dataReservationAccept.forEach((reservation: any) => {
          reservation.isDropdownOpen = false;
        });
      }
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

  getFloors(): number[] {
    const uniqueFloors = new Set<number>();
    if (Array.isArray(this.originalDataTable)) {
      this.originalDataTable.forEach(table => {
        uniqueFloors.add(table.floor);
      });
    } else {
      console.error('originalDataTable is not an array:', this.originalDataTable);
    }
    return Array.from(uniqueFloors).sort((a, b) => a - b);
  }

  getTableOFFloor(floor: number) {
    this.selectedFloor = floor;
    this.filterTablesByFloorAndStatus(this.selectedTable);
  }

  //=================================================================================================================================

  getTableOFFloorEmpty(floor: any): void {
    this.selectedFloor = parseInt(floor, 10);
    this.dataTable = this.originalDataTable.filter(table => table.floor === this.selectedFloor);
  }
  onClickButton(event: MouseEvent) {
    const button = event.target as HTMLButtonElement;
    button.classList.remove('button-normal');
    button.classList.add('button-clicked');
  }
  toggleTableSelection(table: any) {
    // Chỉ cho phép thay đổi selection nếu status là 0
    if (table.status === 0) {
      const index = this.selectedTableIds.indexOf(table.tableId);
      if (index > -1) {
        this.selectedTableIds.splice(index, 1);
      } else {
        this.selectedTableIds.push(table.tableId);
      }
    }
    console.log(this.selectedTableIds);
  }

  toggleDropdownTable(event: Event, table: any) {
    event.stopPropagation();
    table.showDropdown = !table.showDropdown;
  }

  getTimeOnly(dateTime: string): string {
    const date = new Date(dateTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }


  //================================================================================================================
  getReservationData(): void {
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    this.reservationService.getReservationList(2).subscribe(
      response => {
        this.dataReservationToday = response.map((reservation: any) => ({
          ...reservation,
          isDropdownOpen: false
        }));
        this.dataReservationAccept = [...this.dataReservationToday];
        this.filterOrdersByDate();
        console.log(response);
        console.log(this.dateNow);

      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  onDateFromChange(): void {
    if (this.dateTo < this.dateFrom) {
      this.dateTo = this.dateFrom;
    }
    this.filterOrdersByDate();
  }

  onDateToChange(): void {
    this.filterOrdersByDate();
  }

  filterOrdersByDate(): void {
    if (this.dateFrom && this.dateTo) {
      const fromDate = moment(this.dateFrom).startOf('day').toDate();
      const toDate = moment(this.dateTo).endOf('day').toDate();

      this.dataReservationAccept = this.dataReservationToday.filter((order: { reservationTime: string | Date }) => {
        const orderDate = new Date(order.reservationTime);
        return orderDate >= fromDate && orderDate <= toDate;
      });
      console.log(this.dataReservationAccept);
    } else {
      this.dataReservationAccept = this.dataReservationToday.filter((order: { quantity: number }) => order.quantity > 0);
    }
    this.totalItems = this.dataReservationAccept.length;
  }

  updateStatusReservation(id: number): void {
    this.reservationService.updateStatusReservation(id, 5).subscribe(
      response => {
        this.getTableData();
        this.getReservation();
        this.getReservationData();
        this.getReservationId(id);
      },
      error => {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        if (error.error && error.error.errors) {
          console.error('Lỗi xác thực:', error.error.errors);
        }
      }
    );
  }

  getReservationId(id: any) {
    this.reservationService.getReservation(id).subscribe(
      response => {
        this.updateOrderStatus(response.data.order.orderId);
      },
      error => {
        console.error('Error fetching invoice:', error);
      }
    );
  }

  updateOrderStatus(id: any) {
    const data = {
      status: 5
    }
    this.reservationService.updateOrderStatus(id, data).subscribe(
      data => {
      },
      error => {
        console.error('Error fetching invoice:', error);
      }
    );
  }


  openPopup(reserId: number) {
    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
    this.selectedTable = 'all';
    this.selectedFloor = 1;
    this.reserId = reserId;
    this.reservationService.getTableReservation(this.reserId).subscribe(
      response => {
        if (typeof response.reservationTime === 'string') {
          this.reservationTimeSelected = response.reservationTime;
        } else {
          console.error('reservationTime không phải là một chuỗi:', response.reservationTime);
        }
        console.log(this.reservationTimeSelected);
        const { currentDayReservationTables, allTables } = response;
        this.originalDataTable = allTables.map(table => {
          const reservedTables = currentDayReservationTables.filter(t => t.tableId === table.tableId);
          const reservationTimes = reservedTables.map(t => t.reservationTime);
          reservationTimes.sort((a, b) => {
            const dateA = a ? new Date(a) : null;
            const dateB = b ? new Date(b) : null;
            if (!dateA || !dateB) {
              return 0;
            }
            return dateA.getTime() - dateB.getTime();
          });
          return { ...table, reservationTimes: reservationTimes };
        });

        this.dataTable = [...this.originalDataTable];
        console.log(response);
        console.log(this.dataTable);
        this.filterTablesByFloorAndStatus(this.selectedTable);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  closePopup() {
    // Đóng modal
    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
    this.selectedFloor = 1;
    this.selectedTable = 'all';
    this.filterTablesByFloorAndStatus(this.selectedTable);
  }

  openConfirmSaveModal() {
    const confirmModal = document.getElementById('confirmSaveModal');
    if (confirmModal) {
      confirmModal.classList.add('show');
      confirmModal.style.display = 'block';
    }
  }

  closeConfirmSaveModal() {
    const confirmModal = document.getElementById('confirmSaveModal');
    if (confirmModal) {
      confirmModal.classList.remove('show');
      confirmModal.style.display = 'none';
    }
    this.selectedTableIds = [];
  }

  confirmSave() {
    const request = {
      reservationId: this.reserId,
      tableIds: this.selectedTableIds
    }
    console.log(request);
    this.tableService.createTableReservation(request).subscribe({
      next: response => {
        console.log(response);
        this.getReservationData();
      },
      error: error => {
        if (error.error instanceof ErrorEvent) {
          console.error('An error occurred:', error.error.message);
        } else {
          console.error(`Backend returned code ${error.status}, ` +
            `body was: ${JSON.stringify(error.error)}`);
        }
      }
    });
    this.closeConfirmSaveModal();
    this.closePopup();
  }

  //================================================================================================================

  getReservation(): void {
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    this.reservationService.getReservationList(1).subscribe(
      response => {
        this.dataReservationPending = response;
        this.totalItems = this.dataReservationPending.length; // Cập nhật lại tổng số bản ghi
        this.paginateData(); // Sau khi cập nhật totalItems, cắt dữ liệu cho trang hiện tại

      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  getReservationById(id: number): void {
    this.setView('detail-reservation');
    this.reservationService.getReservation(id).subscribe(
      response => {
        console.log(response); // Add this line to inspect the response
        this.reservationDetail = response;
      },
      error => {
        console.error('Error:', error);
      }
    );
  }


  updateReservationById(id: number, status: number, orderId: number | null, reserTime: string, tableOfReservation: any, index: number): void {

    if (tableOfReservation && tableOfReservation.length > 0) {
      for (let i = 0; i < tableOfReservation.length; i++) {
        const table = tableOfReservation[i];
        const tableId = table.tableId;

        // Gọi hàm checkTableStatus với tableId
        this.checkTableStatus(tableId);

        // Kiểm tra nếu this.status khác 0 thì dừng vòng lặp
        if (this.status !== 0) {
          console.log("Stopping the loop as status is not 0.");
          break; // Dừng vòng lặp
        }
      }
    } else {
      console.log("No tables to check.");
    }

    const date: string = reserTime.split('T')[0];
    if (this.status === 0 && date === this.dateString) {
      this.reservationService.updateStatusReservation(id, status).pipe(
        switchMap(response => {
          // Update table status
          return this.reservationService.updateStatusTable(id, 1);
        }),
        switchMap(response => {
          // If orderId is provided, update the order status
          if (orderId !== null) {
            const status = { status: 3 };
            return this.tableService.updateOrderStatus(orderId, status).pipe(
              switchMap(response => {
                // Create table order if orderId is provided
                const tableIds = this.findTableIdsByReservationId(id);
                const request = {
                  orderId: orderId,
                  tableIds: tableIds
                };
                return this.tableService.createTableOrder(request);
              })
            );
          }
          // If no orderId, just return an observable of null
          return of(null);
        })
      ).subscribe(
        response => {
          console.log('Phản hồi từ API:', response);
          this.getTableData();
          this.getReservation();
          this.getReservationData();
        },
        error => {
          console.error('Lỗi khi cập nhật trạng thái:', error);
          if (error.error && error.error.errors) {
            console.error('Lỗi xác thực:', error.error.errors);
          } else {
            console.error('Thông tin lỗi:', error.message);
          }
          // Cập nhật thông báo lỗi cụ thể với chỉ số
          this.errorMessages[index] = 'Lỗi cập nhật trạng thái cho đặt chỗ ' + id + ': ' + (error.message || 'Có lỗi xảy ra');
        }
      );
    } else {
      this.errorMessages[index] = 'Không thể nhận bàn nhận bàn cho đặt chỗ '; // Thêm thông báo lỗi cụ thể với chỉ số
      setTimeout(() => {
        this.errorMessages[index] = ''; // Xóa thông báo
      }, 3000);
    }
  }


  updateErrorMessage(index: number, message: string) {
    this.errorMessages[index] = message;
  }

  findTableIdsByReservationId(reservationId: number): number[] {
    const reservation = this.dataReservationAccept.find((item: { reservationId: number; }) => item.reservationId === reservationId);
    if (reservation) {
      return reservation.tableOfReservation.map((table: { tableId: any; }) => table.tableId);
    }
    return [];
  }

  updateStatusReservationById(id: number, status: number): void {
    this.reservationService.updateStatusReservation(id, status).pipe(
      switchMap(response => {
        return this.reservationService.updateStatusTable(id, 1);
      })
    ).subscribe(
      response => {
        this.getTableData();
        this.getReservation();
        this.getReservationData();
      },
      error => {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        if (error.error && error.error.errors) {
          console.error('Lỗi xác thực:', error.error.errors);
        }
      }
    );
  }

  //=================================================================================================================
  selectTab(index: number): void {
    this.selectedIndex = index;
    this.currentPage = 1;
    if (this.searchTerm.trim() === '') {
      this.getReservationList();
    } else {
      this.getSearchList();
    }
  }

  getReservationList(): void {
    const status = this.selectedIndex > 0 ? this.selectedIndex : undefined;
    console.log(status);

    this.reservationService.getReservationList(status).subscribe(
      response => {
        this.dataReservation = this.filterDataByStatus(response, this.selectedIndex);
        this.totalItems = this.dataReservation.length;
        this.paginateData();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }


  filterDataByStatus(data: any[], status: number): any[] {
    if (status === undefined || status === 0) {
      return data.filter(item => item.status !== 0);
    }
    return data.filter(item => item.status === status);
  }

  groupTablesByFloor(tables: any[]): any[] {
    const groupedTables = tables.reduce((acc, table) => {
      if (!acc[table.floor]) {
        acc[table.floor] = [];
      }
      acc[table.floor].push(table.tableId);
      return acc;
    }, {});

    return Object.keys(groupedTables).map(floor => {
      const tableIds = groupedTables[floor];
      tableIds.sort((a: number, b: number) => a - b); // Sort table IDs
      let tableRange = '';
      if (tableIds.length === 1) {
        tableRange = `${tableIds[0]}`;
      } else {
        tableRange = `${tableIds[0]}-${tableIds[tableIds.length - 1]}`;
      }
      return {
        floor,
        tableRange
      };
    });
  }
  formatTables(tables: any[]): string {
    if (!tables || tables.length === 0) {
      return 'Trống';
    }
    const grouped = this.groupTablesByFloor(tables);
    return grouped.map(group => `Tầng ${group.floor}, bàn ${group.tableRange}`).join('<br>');
  }

  getStatusLabel(status: number): { label: string, class: string } {
    let label = 'Không xác định'; // Default label if status doesn't match
    let cssClass = ''; // Default class
    switch (status) {
      case 1:
        label = 'Đợi xác nhận';
        cssClass = 'status-pending';
        break;
      case 2:
        label = 'Chưa nhận bàn';
        cssClass = 'status-pending';
        break;
      case 3:
        label = 'Đã nhận bàn';
        cssClass = 'status-confirmed';
        break;
      case 4:
        label = 'Đã hoàn thành';
        cssClass = 'status-completed';
        break;
      case 5:
        label = 'Đã hủy';
        cssClass = 'status-cancelled';
        break;
      default:
        break;
    }
    return { label, class: cssClass };
  }


  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      if (this.currentView === 'booking-request') {
        this.getReservation();
      }
      else if (this.currentView === 'booking-history') {
        this.getReservationList();
      }
      else if (this.currentView === 'booking-schedule') {
        this.getReservationData();
      }

    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      if (this.currentView === 'booking-request') {
        this.getReservation();
      }
      else if (this.currentView === 'booking-history') {
        this.getReservationList();
      }
      else if (this.currentView === 'booking-schedule') {
        this.getReservationData();
      }
    }
  }

  paginateData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    if (this.currentView === 'booking-request') {
      if (this.dataReservationPending) {
        this.dataReservationPending = this.dataReservationPending.slice(startIndex, endIndex);
      }
    }
    else if (this.currentView === 'booking-history') {
      if (this.dataReservation) {
        this.dataReservation = this.dataReservation.slice(startIndex, endIndex);
      }
    }
    else if (this.currentView === 'booking-schedule') {
      if (this.dataReservationAccept) {
        this.dataReservationAccept = this.dataReservationAccept.slice(startIndex, endIndex);
      }
    }

  }
  goToDesiredPage(): void {
    if (this.currentPage >= 1 && this.currentPage <= this.totalPages) {
      this.getReservationList();
    } else {
      // Xử lý thông báo lỗi nếu số trang nhập không hợp lệ
      console.log('Invalid page number');
    }
  }
  getSearchList(): void {
    const status = this.selectedIndex > 0 ? this.selectedIndex : undefined;
    if (this.searchTerm.trim() === '') {
      this.getReservationList();
      return;
    }

    this.reservationService.searchReservation(this.searchTerm).subscribe(
      response => {
        console.log('response', response);
        this.dataReservation = this.filterDataByStatus(response, this.selectedIndex);
        console.log(this.searchTerm);
        console.log(this.dataReservation);
        this.totalItems = this.dataReservation.length;
        this.paginateData();
      },
      error => {
        console.log(this.searchTerm);
        console.error('Error:', error);
      }
    );
  }

  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchTerm = inputElement.value;
    this.currentPage = 1;
    this.searchTermSubject.next(this.searchTerm);
  }

  //==================================================================================================================================

  status: number = 0;
  checkTableStatus(id: number): void {
    this.tableService.getTablesById(id).subscribe(
      response => {
        this.status = response.status;
        console.log(id);


      },
      error => {

      }
    );
  }

  async deleteTable(reserId: any, table: any[]) {
    if (table && table.length > 0) {
      for (const t of table) {
        try {
          const response = await this.tableService.deleteTables(reserId).toPromise();
          console.log("Deleted successfully for table:", t);
          window.location.reload();
        } catch (error) {
          console.error("Error deleting table:", t, error);

        }
      }
    } else {
      console.log("No tables to delete.");
    }
  }

}
