import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableService } from '../../../service/table.service';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ReservationService } from '../../../service/reservation.service';
@Component({
  selector: 'app-tableManagement',
  standalone: true,
  templateUrl: './tableManagement.component.html',
  styleUrls: ['./tableManagement.component.css'],
  imports: [CommonModule, FormsModule]
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

  constructor(private tableService: TableService, private reservationService: ReservationService) { }

  ngOnInit(): void {
    this.getTableData();
    this.getReservationData();
    this.getReservation();
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
      this.dataReservationAccept.forEach((reservation: any) => {
        reservation.isDropdownOpen = false;
      });
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
  //================================================================================================================
  getReservationData(): void {
    this.reservationService.getReservationAccept(1).subscribe(
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
  }
  onSelectWeek() {
    this.dataReservationAccept = this.dataReservationToday;
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
    this.reservationService.getReservationAccept(0).subscribe(
      response => {
        this.dataReservationPending = response;
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  getReservationById(id: number): void {
    this.setView('detail-reservation');
    console.log(id);
    this.reservationService.getReservation(id).subscribe(
      response => {
        this.reservationDetail = response;
        console.log('ReservationDetails:', this.reservationDetail);

      },
      error => {
        console.error('Error:', error);
      }
    );
  }

}
