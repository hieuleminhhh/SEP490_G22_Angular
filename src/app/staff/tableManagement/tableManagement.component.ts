import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableService } from '../../../service/table.service';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ReservationService } from '../../../service/reservation.service';
@Component({
  selector: 'app-tableManagement',
  standalone:true,
  templateUrl: './tableManagement.component.html',
  styleUrls: ['./tableManagement.component.css'],
  imports:[ CommonModule, FormsModule]
})
export class TableManagementComponent implements OnInit {

  currentView: string = 'table-layout';
  dataTable: any[] = [];
  originalDataTable: any[] = [];
  dataReservationAccept: any;
  dataReservationToday: any;
  selectedTime:string='today';
  dataReservationPending:any;
  reservationDetail:any;

  constructor(private tableService:TableService, private reservationService:ReservationService) { }

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
        console.log('Tables:', response);
        this.originalDataTable = response; // Lưu dữ liệu ban đầu
        this.dataTable = [...this.originalDataTable];
        this.onSelectFloor1();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  onSelectFloor1(): void {
    this.dataTable = this.originalDataTable.filter(table => table.floor === 1);
  }
  onSelectFloor2(): void {
    this.dataTable = this.originalDataTable.filter(table => table.floor === 2);
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
        console.log('Reservation:', this.dataReservationAccept);
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
    console.log('Reservation:', this.dataReservationAccept);
  }
  onSelectWeek(){
    this.dataReservationAccept = this.dataReservationToday;
    console.log('Reservation:', this.dataReservationAccept);
  }
  assignTable(table:number){

  }

  //================================================================================================================

  getReservation(): void {
    this.reservationService.getReservationAccept(0).subscribe(
      response => {
        this.dataReservationPending = response;
        console.log('ReservationPending:', this.dataReservationPending);

      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  getReservationById(id:number): void {
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
