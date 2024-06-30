import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableService } from '../../../service/table.service';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ReservationService } from '../../../service/reservation.service';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-tableManagement',
  standalone: true,
  templateUrl: './tableManagement.component.html',
  styleUrls: ['./tableManagement.component.css'],
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TableManagementComponent implements OnInit {

  currentView: string = 'table-layout';
  dataTable: any;
  originalDataTable: any[] = [];
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

  tabs: string[] = ['Tất cả', 'Chưa nhận bàn', 'Đã nhận bàn', 'Đã hủy', 'Đã hoàn thành'];
  selectedIndex: number = 0;
  searchTerm: string = '';

  currentPage = 1; // Trang hiện tại
  itemsPerPage = 8; // Số bản ghi trên mỗi trang
  totalItems = 0; // Tổng số bản ghi


  constructor(private tableService: TableService, private reservationService: ReservationService) { }

  ngOnInit(): void {
    this.getTableData();
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
  onClickButton(event: MouseEvent) {
    const button = event.target as HTMLButtonElement;
    button.classList.remove('button-normal');
    button.classList.add('button-clicked');
  }
  toggleTableSelection(tableId: number): void {
    const index = this.selectedTableIds.indexOf(tableId);
    if (index === -1) {
      this.selectedTableIds.push(tableId);
    } else {
      this.selectedTableIds.splice(index, 1);
    }
  }
  //================================================================================================================
  getReservationData(): void {
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    this.reservationService.getReservationList(1).subscribe(
      response => {
        this.dataReservationToday = response.map((reservation: any) => ({
          ...reservation,
          isDropdownOpen: false
        }));
        this.dataReservationAccept = [...this.dataReservationToday];
        this.applySelectedTimeFilter();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  onSelectTimeframe() {
    // This method will be called whenever the dropdown selection changes
    this.applySelectedTimeFilter();
  }

  applySelectedTimeFilter() {
    if (this.selectedTime === 'today') {
      this.onSelectToday();
    } else if (this.selectedTime === 'this_week') {
      this.onSelectWeek();
    }
  }
  onSelectToday() {
    const today = moment().startOf('day');
    this.dataReservationAccept = this.dataReservationToday.filter((reservation: any) => {
      const reservationTime = moment(reservation.reservationTime);
      return reservationTime.isSame(today, 'day');
    });
    this.totalItems = this.dataReservationAccept.length;
    this.paginateData();
  }
  onSelectWeek() {
    this.dataReservationAccept = this.dataReservationToday;
    this.totalItems = this.dataReservationAccept.length;
    this.paginateData();
  }

  openPopup() {
    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
    this.selectedTable = 'empty';
    this.selectedFloor = 1;
    this.filterTablesByFloorAndStatus(this.selectedTable);
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

  saveSelections() {
    // Handle saving selected tables logic here

    this.closePopup();
  }

  //================================================================================================================

  getReservation(): void {
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    this.reservationService.getReservationList(0).subscribe(
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
        this.reservationDetail = response;

      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  updateReservationById(id: number, status: number): void {
    this.reservationService.updateStatusReservation(id, status).subscribe(
      response => {
        this.getReservation();
        this.getReservationData();
      },
      error => {
        console.error('Error:', error);
        if (error.error && error.error.errors) {
          console.error('Validation Errors:', error.error.errors);
        }
      }
    );
  }

  //=================================================================================================================
  selectTab(index: number): void {
    this.selectedIndex = index;
    this.getReservationList();
  }

  getReservationList(): void {
    const status = this.selectedIndex > 0 ? this.selectedIndex : undefined;
    const params = {
      status,
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    this.reservationService.getReservationList(status).subscribe(
      response => {
        this.dataReservation = this.filterDataByStatus(response, this.selectedIndex);
        this.totalItems = this.dataReservation.length; // Cập nhật lại tổng số bản ghi
        this.paginateData(); // Sau khi cập nhật totalItems, cắt dữ liệu cho trang hiện tại
      },
      error => {
        console.error('Error:', error);
      }
    );
  }


  filterDataByStatus(data: any[], status: number): any[] {
    if (status === 0) {
      return data.filter(item => item.status !== 0); // Return all data except those with status = 0
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
    if (tables.length === 0) {
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
        label = 'Chưa nhận bàn';
        cssClass = 'status-pending';
        break;
      case 2:
        label = 'Đã nhận bàn';
        cssClass = 'status-confirmed';
        break;
      case 3:
        label = 'Đã hoàn thành';
        cssClass = 'status-completed';
        break;
      case 4:
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



}
