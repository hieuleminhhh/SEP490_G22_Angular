import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableService } from '../../../service/table.service';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ReservationService } from '../../../service/reservation.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Table, TableReservationResponse, Tables } from '../../../models/table.model';
import { DatePipe } from '@angular/common';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { HeaderOrderStaffComponent } from '../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '../../../service/account.service';


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
  selectedFloor: string = '';
  selectedTableIds: number[] = [];
  dataReservation: any;
  reservationTimeSelected: string | undefined;
  reserId: number | undefined;
  guestNumber: number = 0;
  totalCapacity: number = 0;


  tabs: string[] = ['Tất cả', '', 'Chưa nhận bàn', 'Đã nhận bàn', 'Đã hoàn thành', 'Đã hủy'];
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
  showDropdowns: { [key: number]: boolean } = {};

  allTable: any;
  accountId: any;
  accountName: string = '';
  showCancelModal: boolean = false;
  cancelReason: string = '';
  cancelMessage: string | null = null;
  showAcceptModal: boolean = false;
  isModalVisible: boolean = false;
  onConfirmCallback: () => void = () => { };
  modalMessage: any;
  guestInfo: any;

  constructor(private tableService: TableService, private dialog: MatDialog, private reservationService: ReservationService,
    private router: Router, private accountService: AccountService) { }

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
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    if (this.accountId) {
      this.getAccountData();
    } else {
      console.error('Account ID is not available');
    }
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
  @ViewChild('tableModal') tableModal!: TemplateRef<any>;
  showModals: boolean[] = [];
  openTableModal(index: number): void {
    this.showModals[index] = true;
  }

  closeTableModal(index: number): void {
    this.showModals[index] = false;
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
        this.allTable = response.filter((table: { status: number; }) => table.status === 0 || table.status === 1);
        this.originalDataTable = response.filter((table: { status: number; }) => table.status === 0 || table.status === 1);
        this.selectedFloor = this.originalDataTable[0].floor;
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
  //=================================================================================================================================


  onClickButton(event: MouseEvent) {
    const button = event.target as HTMLButtonElement;
    button.classList.remove('button-normal');
    button.classList.add('button-clicked');
  }
  ishas: boolean = false;
  toggleTableSelection(table: any): void {
    const tableIdIndex = this.selectedTableIds.indexOf(table.tableId);
    if (this.guestNumber <= table.capacity) {
      if (tableIdIndex === -1) {
        if (this.selectedTableIds.length > 0) {
          this.selectedTableIds = [];
          this.totalCapacity = 0;
        }
        this.selectedTableIds.push(table.tableId);
        this.totalCapacity = table.capacity;
        this.ishas = true;
      } else {
        this.selectedTableIds.splice(tableIdIndex, 1);
        this.totalCapacity = 0;
        this.ishas = false;
      }
    } else {
      if (tableIdIndex === -1) {
        console.log('181');
        const potentialTotalCapacity = this.totalCapacity + table.capacity;
        console.log(potentialTotalCapacity);
        if (potentialTotalCapacity >= this.guestNumber) {
          if (this.guestNumber > this.totalCapacity) {
            this.selectedTableIds.push(table.tableId);
            this.totalCapacity += table.capacity;
            this.ishas = true;
          }
        } else {
          this.selectedTableIds.push(table.tableId);
          this.totalCapacity += table.capacity;
        }
      } else {
        console.log('194');
        this.selectedTableIds.splice(tableIdIndex, 1);
        this.totalCapacity -= table.capacity;
        this.ishas = false;
      }
    }
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

  getAccountData(): void {
    this.accountService.getAccountById(this.accountId).subscribe(
      response => {
        this.accountName = response.firstName + response.lastName;
        console.log(this.accountName);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  updateStatusReservation(id: number, cancelReason: string): void {
    this.reservationService.updateStatusReservation(id, 5).subscribe(
      response => {
        const body = {
          reasonCancel: cancelReason,
          cancelBy: this.accountName
        }
        console.log(body);

        this.reservationService.updatereasonCancel(id, body).subscribe(
          response => {
            console.log(response);

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
      },
      error => {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        if (error.error && error.error.errors) {
          console.error('Lỗi xác thực:', error.error.errors);
        }
      }
    );
  }

  openCancelModal(reservationId: number): void {
    this.currentReservationId = reservationId;
    this.showCancelModal = true;
    this.cancelMessage = null;
    console.log(reservationId);
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.cancelReason = '';
    this.currentReservationId = undefined;
    this.cancelMessage = null;
  }

  openAcceptModal(reservationId: number): void {
    this.currentReservationId = reservationId;
    this.showAcceptModal = true;
  }

  closeAcceptModal(): void {
    this.showAcceptModal = false;
    this.currentReservationId = undefined;
  }
  confirmAccept(): void {
    if (this.currentReservationId) {
      this.updateStatusReservationById(this.currentReservationId, 2);
      this.closeAcceptModal();
    }
  }
  confirmCancel(): void {
    if (this.currentReservationId && this.cancelReason.trim()) {
      this.updateStatusReservation(this.currentReservationId, this.cancelReason);
      this.closeCancelModal();
    } else {
      this.errorMessage = 'Vui lòng nhập lý do hủy';
    }
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


  openPopup(reserId: number, time: any) {

    console.log(time);
    this.reservationTimeSelected = time;
    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
    this.selectedTable = 'all';
    this.selectedFloor = this.dataTable[0].floor;
    this.getTableOFFloorEmpty(this.selectedFloor, time);
    this.reserId = reserId;
    this.reservationService.getTableReservation(this.reserId).subscribe(
      response => {
        if (typeof response.reservationTime === 'string') {
          this.reservationTimeSelected = response.reservationTime;
        } else {
          console.error('reservationTime không phải là một chuỗi:', response.reservationTime);
        }
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
        this.filterTablesByFloorAndStatus(this.selectedTable);
      },
      error => {
        console.error('Error:', error);
      }
    );
    this.reservationService.getReservation(reserId).subscribe(
      response => {
        this.guestNumber = response.data.guestNumber;
      },
      error => {
        console.error('Error:', error);
      }
    );
    console.log(this.selectedTableIds);

  }
  closePopup() {
    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
    this.selectedTable = 'all';
    this.filterTablesByFloorAndStatus(this.selectedTable);
    this.selectedFloor = this.dataTable[0].floor;
    this.selectedTableIds = [];
    this.ishas = false;
    this.totalCapacity = 0;
  }
  validMessage: string = '';
  openConfirmSaveModal() {
    if (this.ishas === true) {
      const confirmModal = document.getElementById('confirmSaveModal');
      if (confirmModal) {
        confirmModal.classList.add('show');
        confirmModal.style.display = 'block';
      }
    } else {
      this.validMessage = 'Chưa xếp đủ bàn cho số lượng khách';
      setTimeout(() => {
        this.validMessage = '';
      }, 3000);

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
  checkAndConfirmReservation(id: number, status: number, orderId: number | null, reserTime: string, tableOfReservation: any, index: number): void {
    this.guestInfo = this.dataReservationAccept[index];
    const now = new Date();
    const reservationTime = new Date(reserTime);
    const timeDifference = reservationTime.getTime() - now.getTime();
    const timeDifferenceInHours = timeDifference / (1000 * 60 * 60);
    this.onConfirmCallback = () => {
      this.updateReservationById(id, status, orderId, reserTime, tableOfReservation, index);
    };
    if (timeDifferenceInHours > 0) {
      this.modalMessage = `Còn ${Math.floor(timeDifferenceInHours)} giờ ${Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60))} phút mới đến giờ nhận bàn.`;
    }
    this.openModal();
  }
  openModal(): void {
    this.isModalVisible = true;
  }
  closeModal(): void {
    this.isModalVisible = false;
  }
  confirmReservation(): void {
    this.onConfirmCallback(); // Execute the stored callback
    if (this.messageerrorTable) {
      this.closeModal();
    }
  }
  cancelReservation(): void {
    this.closeModal();
  }
  messageerrorTable: string = '';
  updateReservationById(id: number, status: number, orderId: number | null, reserTime: string, tableOfReservation: any, index: number): void {
    if (tableOfReservation && tableOfReservation.length > 0) {
      const statusChecks: Observable<Tables>[] = tableOfReservation.map((table: { tableId: any; }) => {
        const tableId = table.tableId;
        return this.checkTableStatus(tableId);
      });
      forkJoin(statusChecks).subscribe((results: Tables[]) => {
        const tablesInUse: string[] = [];
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.status !== 0) {
            console.log("Stopping the loop as status is not 0.");
            tablesInUse.push(result.lable);
          }
        }
        if (tablesInUse.length > 0) {
          this.messageerrorTable = `Không thể nhận bàn vì ${tablesInUse.join(', ')} đang sử dụng.`;
          setTimeout(() => {
            this.messageerrorTable = '';
          }, 3000);
          return;
        }
        this.performReservationUpdate(id, status, orderId, reserTime, index);
      }, error => {
        console.error('Lỗi khi kiểm tra trạng thái bàn:', error);
      });
    } else {
      console.log("No tables to check.");
      return;
    }

  }
  performReservationUpdate(id: number, status: number, orderId: number | null, reserTime: string, index: number): void {
    const date: string = reserTime.split('T')[0];
    if (this.status === 0 && date === this.dateString) {
      this.reservationService.updateStatusReservation(id, status).pipe(
        switchMap(response => {
          return this.reservationService.updateStatusTable(id, 1);
        }),
        switchMap(response => {
          if (orderId !== null) {
            const status = { status: 3 };
            return this.tableService.updateOrderStatus(orderId, status).pipe(
              switchMap(response => {
                const tableIds = this.findTableIdsByReservationId(id);
                const request = {
                  orderId: orderId,
                  tableIds: tableIds
                };
                return this.tableService.createTableOrder(request);
              })
            );
          }
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
          this.errorMessages[index] = 'Lỗi cập nhật trạng thái cho đặt chỗ ' + id + ': ' + (error.message || 'Có lỗi xảy ra');
        }
      );
    } else {
      this.errorMessages[index] = 'Không thể nhận bàn nhận bàn cho đặt chỗ ';
      setTimeout(() => {
        this.errorMessages[index] = '';
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
    this.reservationService.updateStatusReservation(id, status).subscribe(
      response => {
        const body={
          reservationId:id,
          acceptBy: this.accountId
        }
        console.log(body);

        this.reservationService.updateAcceptBy(body).subscribe(
          response => {
          },
          error => {
            console.error('Lỗi khi cập nhật trạng thái:', error);
            if (error.error && error.error.errors) {
              console.error('Lỗi xác thực:', error.error.errors);
            }
          }
        );
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
      return 'Chưa xếp bàn';
    }
    const grouped = this.groupTablesByFloor(tables);
    return grouped.map(group => `${group.floor}, bàn ${group.tableRange}`).join('<br>');
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
  checkTableStatus(id: number): Observable<Tables> {
    return this.tableService.getTablesById(id).pipe(
      catchError(error => {
        console.error('Lỗi khi lấy trạng thái bàn:', error);
        return of({ tableId: id, status: -1, capacity: 0, floor: '', lable: '' });
      })
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

  // getReservationed(date: string) {
  //   this.reservationService.getReservationed(date).subscribe(
  //     (response: any) => { // Sử dụng any
  //       const filteredReservations = response.filter((reservation: any) => reservation.tableId !== null);
  //       console.log(filteredReservations);
  //     },
  //     error => {
  //       console.error('Error fetching reservations:', error);
  //     }
  //   );
  // }
  tableEmpty: any;
  getTableDataEmpty(date: string): void {
    this.reservationService.getTable(date).subscribe(
      response => {
        this.tableEmpty = response;
        this.tableEmpty = this.tableEmpty.filter((table: { floor: string; }) => table.floor === this.selectedFloor);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  getTableOFFloorEmpty(floor: any, time: any): void {
    this.getTableDataEmpty(time);
    this.selectedFloor = floor;
    console.log(this.getSelectedTableNames());

  }
  getSelectedTableNames(): string[] {
    if (Array.isArray(this.allTable)) {
      return this.allTable
        .filter(table => this.selectedTableIds.includes(table.tableId))
        .map(table => table.lable);
    }
    return [];
  }


}

