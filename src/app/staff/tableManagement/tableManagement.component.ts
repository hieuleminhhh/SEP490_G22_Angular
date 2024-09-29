import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { TableService } from '../../../service/table.service';
import { FormsModule } from '@angular/forms';
import moment from 'moment';
import { ReservationService } from '../../../service/reservation.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { BehaviorSubject, forkJoin, Observable, of, Subscription } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { Table, TableReservationResponse, Tables } from '../../../models/table.model';
import { DatePipe } from '@angular/common';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { HeaderOrderStaffComponent } from '../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from '../../../service/account.service';
import { NotificationService } from '../../../service/notification.service';
import { Dish } from '../../../models/dish.model';
import { CheckoutService } from '../../../service/checkout.service';
import { MenuComponent } from '../../common/menu/menu.component';
import { SidebarOrderComponent } from '../SidebarOrder/SidebarOrder.component';
import { Title } from '@angular/platform-browser';
import { ManagerOrderService } from '../../../service/managerorder.service';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-tableManagement',
  standalone: true,
  templateUrl: './tableManagement.component.html',
  styleUrls: ['./tableManagement.component.css'],
  imports: [CommonModule, FormsModule, NgxPaginationModule, SidebarOrderComponent, CurrencyFormatPipe, MenuComponent, HeaderOrderStaffComponent],
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
  dataReservationPending: any[] = [];
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
  errorMessages: string = '';
  showDropdowns: { [key: number]: boolean } = {};

  allTable: any;
  accountId: any;
  accountName: string = '';
  showCancelModal: boolean = false;
  cancelReason: string = '';
  cancelMessage: string | null = null;
  showAcceptModal: boolean = false;
  isModalVisible: boolean = false;
  isModalVisibles: boolean = false;
  onConfirmCallback: () => void = () => { };
  modalMessage: any;
  guestInfo: any;
  messageerrorTable: string = '';
  isClose: boolean = false;
  private socket!: WebSocket;
  private reservationQueue: any[] = [];
  notifications: string[] = [];
  isVisible: boolean[] = [];
  selectedSection: string = 'table-layout';
  reservation = {
    name: '',
    phone: '',
    email: '',
    date: 'today',
    time: '',
    people: 2,
    notes: ''
  };
  minDate: string | undefined;
  maxDate: string | undefined;
  availableHours: string[] = [];
  consigneeName: string = '';
  guestPhone: string = '';
  note: string = '';
  emailGuest: string = '';
  availableTimes: string[] = [];
  formSubmitted = false;
  messages: string[] = [];
  isValid: boolean = false;
  message: string = '';
  formChanged = true;
  cartItems: Dish[] = [];
  currentRequest: any;
  maxValue: number = 1000;
  isValidDish: boolean = false;
  isMenuPopupOpen = false;
  itemQuantityMap: { [key: string]: number } = {};
  private cartSubscription!: Subscription;
  showPersonalInfo: boolean = false;
  dateTime: any;
  constructor(private tableService: TableService, private dialog: MatDialog, private reservationService: ReservationService,
    private router: Router, private checkoutService: CheckoutService,
    private route: ActivatedRoute, private notificationService: NotificationService, private accountService: AccountService,
    private titleService: Title, private orderService: ManagerOrderService) {
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo = this.formatDate(today);
    this.dateNow = this.formatDate(today);
    this.dateString = this.dateNow.toString();
    this.minDate = this.formatDate(today);
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    this.maxDate = this.formatDate(maxDate);
    this.reservation = {
      name: '',
      phone: '',
      email: '',
      date: this.formatDate(today),
      time: '',
      people: 2,
      notes: ''
    };
    this.generateAvailableHours();
  }
  ngAfterViewInit() {
    this.titleService.setTitle('Đặt bàn | Eating House');
  }
  ngOnInit(): void {
    this.getTableData();
    this.searchTermSubject.pipe(debounceTime(300)).subscribe(searchTerm => {
      this.getSearchList();
    });
    this.updateTimes();
    this.cartSubscription = this.reservationService.getCart().subscribe(cartItems => {
      this.cartItems = cartItems;
      this.calculateItemQuantity();
    });
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    if (this.accountId) {
      this.getAccountData();
    }
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
      while (this.reservationQueue.length > 0) {
        this.socket.send(this.reservationQueue.shift());
      }
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.lastSentMessageId &&data.lastSentMessageId === this.lastSentMessageId) {
        console.log('Ignoring message from our own request:', data);
        return;
      }
      try {
        this.getReservation();
        this.addSuccessMessage(data);
      } catch (error) {
        console.error('Error parsing reservation data:', error);
      }
    };

    this.route.queryParams.subscribe(params => {
      this.selectedSection = params['section'] || 'table-layout';
      this.setView(this.selectedSection);
      if (this.selectedSection === 'table-layout') {
        this.getTableData();
      }
      if (this.selectedSection === 'booking-request') {
        this.getReservation();
      }
      if (this.selectedSection === 'booking-schedule') {
        this.getReservationData();
      }
      if (this.selectedSection === 'booking-history') {
        this.getReservationList();
      }
    });
    this.socket.onclose = () => {
      console.log('WebSocket connection closed, attempting to reconnect...');
      setTimeout(() => {
        this.initializeWebSocket();
      }, 5000);
    };
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  initializeWebSocket() {
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => { /* xử lý onopen */ };
    this.socket.onmessage = (event) => { /* xử lý onmessage */ };
    this.socket.onclose = () => { /* xử lý onclose */ };
    this.socket.onerror = (error) => { /* xử lý onerror */ };
  }
  generateAvailableHours() {
    this.availableHours = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
        this.availableHours.push(formattedHour);
      }
    }
  }
  addSuccessMessage(message: string) {
    this.notifications.push(message);
    this.isVisible.push(true);
    const currentIndex = this.notifications.length - 1;
    setTimeout(() => this.closeNotification(currentIndex), 5000);
  }
  closeNotification(index: number) {
    if (index >= 0 && index < this.isVisible.length) {
      this.isVisible[index] = false;
    }
  }
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  setView(view: string) {
    this.currentPage = 1;
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
        console.log(this.allTable);
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

  selectedReservations: any[] = [];
  openModalSchedule(reservations: any[]) {
    this.selectedReservations = reservations; // Set reservations for the modal
    this.isModalVisibles = true; // Show modal
  }

  // Function to close the modal
  closeModalSchedule() {
    this.isModalVisibles = false; // Hide modal
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
        const potentialTotalCapacity = this.totalCapacity + table.capacity;
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
        this.selectedTableIds.splice(tableIdIndex, 1);
        this.totalCapacity -= table.capacity;
        this.ishas = false;
      }
    }
    this.getSelectedTableNames();
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
    this.paginateData();
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

  openCancelModal(reservation: any): void {
    this.currentReservationId = reservation.reservationId;
    this.orderOfReserId = reservation?.order?.orderId;
    this.accountGuestId = reservation?.accountGuestId;
    this.showCancelModal = true;
    this.cancelMessage = null;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.cancelReason = '';
    this.currentReservationId = undefined;
    this.cancelMessage = null;
  }
  detailRes: any;
  orderOfReserId: any;
  accountGuestId: any;
  openAcceptModal(reservation: any): void {
    this.detailRes = reservation;
    console.log(reservation.accountId);

    this.currentReservationId = reservation.reservationId;
    this.orderOfReserId = reservation?.order?.orderId;
    this.accountGuestId = reservation?.accountId;
    this.showAcceptModal = true;
  }
  transform(value: string | Date, format: string = 'dd/MM/yyyy HH:mm', locale: string = 'vi-VN'): string {
    if (!value) return '';

    let date: Date;
    if (typeof value === 'string') {
      date = new Date(value);
      if (isNaN(date.getTime())) {
        return value;
      }
    } else {
      date = value;
    }
    return formatDate(date, format, locale);
  }
  formatDateForPrint(date: Date | string | null): string {
    if (!date) return 'N/A';
    return this.transform(date, 'dd/MM/yyyy HH:mm');
  }
  closeAcceptModal(): void {
    this.showAcceptModal = false;
    this.currentReservationId = undefined;
  }
  async confirmAccept(event: Event): Promise<void> {
    event.preventDefault(); // Ngăn chặn hành động mặc định

    if (this.currentReservationId) {
      const reservation = this.dataReservationPending.find((reservation: { reservationId: any }) => reservation.reservationId === this.currentReservationId);

      if (reservation) {
        // Update reservation status
        await this.updateStatusReservationById(this.currentReservationId, 2, reservation.reservationTime, reservation.guestNumber);
        console.log('ReserID', this.currentReservationId);

        // Create notification
        this.createNotification(this.orderOfReserId, 1, this.accountGuestId);
        console.log('OrderID', this.orderOfReserId);

        // Fetch customer email and other details
        try {
          const emailResponse = await this.reservationService.getGuestEmailByReservationId(this.currentReservationId).toPromise();

          const customerEmail = emailResponse.email;
          const consigneeName = emailResponse.consigneeName;
          const supportPhone = emailResponse.settingPhone;
          const supportEmail = emailResponse.settingEmail;
          const companyName = emailResponse.eateryName;
          const reservationTime = emailResponse.reservationTime;
          console.log('LISSTTTTT', emailResponse);
          const orderId = emailResponse.orderId;

          // Tạo nội dung email
          let orderDetailsLink = '';
          if (orderId) {
            orderDetailsLink = `
              <p>Quý khách có thể xem chi tiết đơn hàng của mình tại đường dẫn sau:
              <a href="http://localhost:4200/orderDetail/${orderId}" style="color: blue; text-decoration: underline;">Xem chi tiết đơn hàng tại đây</a>.</p>`;
          }

          // Gửi email ngay lập tức
          await firstValueFrom(this.orderService.sendEmail(
            customerEmail,
            'Xác Nhận Đặt Chỗ Thành Công Từ Eating House',
            `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
              <p>Kính gửi <strong>${consigneeName}</strong>,</p>
              <p>Chúng tôi xin xác nhận rằng đặt chỗ của bạn đã được chấp nhận.</p>
              <p>Thời gian đặt chỗ: <strong>${this.formatDateForPrint(reservationTime)}</strong>.</p>
              ${orderDetailsLink}
              <p>Nếu có bất kỳ thắc mắc hoặc phản hồi nào, xin vui lòng liên hệ với chúng tôi qua số điện thoại <strong>${supportPhone}</strong> hoặc email <strong>${supportEmail}</strong>.</p>
              <p>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi.</p>
              <p>Trân trọng,<br>${companyName}<br>${supportPhone}</p>
            </div>`
          ));

          console.log('Confirmation email sent successfully');
        } catch (error) {
          console.error('Error sending email:', error);
        }
      }
    }
  }




  async confirmCancel(event: Event): Promise<void> {
    event.preventDefault(); // Ngăn chặn hành động mặc định

    if (this.currentReservationId && this.cancelReason.trim()) {
      // Cập nhật trạng thái hủy đơn
      await this.updateStatusReservation(this.currentReservationId, this.cancelReason);
      console.log('ReserID', this.currentReservationId);

      // Tạo thông báo cho hủy đơn
      this.createNotification(this.orderOfReserId, 2, this.accountGuestId);
      console.log('OrderID', this.orderOfReserId);

      try {
        this.showCancelModal = false;
        const emailResponse = await this.reservationService.getGuestEmailByReservationId(this.currentReservationId).toPromise();

        const customerEmail = emailResponse.email;
        const consigneeName = emailResponse.consigneeName;
        const supportPhone = emailResponse.settingPhone;
        const supportEmail = emailResponse.settingEmail;
        const companyName = emailResponse.eateryName;
        const reservationTime = emailResponse.reservationTime; // Lấy thời gian đặt chỗ
        const orderId = emailResponse.orderId; // Lấy orderId
        const cancellationTime = new Date().toLocaleString(); // Lấy thời gian hủy đơn

        // Tạo nội dung email
        let orderDetailsLink = '';
        if (orderId) {
          orderDetailsLink = `
            <p>Quý khách có thể xem chi tiết đơn hàng của mình tại đường dẫn sau:
            <a href="http://localhost:4200/orderDetail/${orderId}" style="color: blue; text-decoration: underline;">Xem chi tiết đơn hàng tại đây</a>.</p>`;
        }

        // Gửi email thông báo hủy đơn
        await firstValueFrom(this.orderService.sendEmail(
          customerEmail,
          'Thông Báo Hủy Đơn Đặt Chỗ Từ Eating House',
          `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>Kính gửi <strong>${consigneeName}</strong>,</p>
            <p>Chúng tôi xin thông báo rằng đặt chỗ của bạn vào thời gian <strong>${this.formatDateForPrint(reservationTime)}</strong> đã bị hủy với lý do: <strong>${this.cancelReason}</strong>.</p>
            ${orderDetailsLink}
            <p>Nếu có bất kỳ thắc mắc hoặc phản hồi nào, xin vui lòng liên hệ với chúng tôi qua số điện thoại <strong>${supportPhone}</strong> hoặc email <strong>${supportEmail}</strong>.</p>
            <p>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi.</p>
            <p>Trân trọng,<br>${companyName}<br>${supportPhone}</p>
          </div>`
        ));

        console.log('Cancellation email sent successfully');

      } catch (error) {
        console.error('Error sending cancellation email:', error);
        this.errorMessage = 'Có lỗi xảy ra khi gửi email hủy đơn.';
      }
    } else {
      this.errorMessage = 'Vui lòng nhập lý do hủy';
    }
  }



  getReservationId(id: any) {
    this.reservationService.getReservation(id).subscribe(
      response => {
        this.updateOrderStatus(response.data?.order?.orderId);
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


  openPopup(reserId: number, time: any, tableOfReservation: any) {
    this.reservationTimeSelected = time;
    console.log(this.showPersonalInfo);

    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
    this.selectedTable = 'all';
    this.selectedFloor = this.dataTable[0].floor;

    this.reserId = reserId;
    this.tableOfReservation = tableOfReservation;
    this.getTableOFFloorEmpty(this.selectedFloor, time);
    this.reservationService.getReservation(reserId).subscribe(
      response => {
        this.guestNumber = response.data.guestNumber;
      },
      error => {
        console.error('Error:', error);
      }
    );
    if (tableOfReservation.length < 1) {
      console.log(this.selectedTableIds);
    } else {
      tableOfReservation.forEach((reservation: { tableId: any; }) => {
        const tableId = reservation.tableId;
        if (!this.selectedTableIds.includes(tableId)) {
          this.selectedTableIds.push(tableId);
        }
      });
      this.totalCapacity = this.tableOfReservation.reduce((total: number, reservation: { capacity: number }) => {
        return total + reservation.capacity;
      }, 0);
      this.ishas = true;
    }
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
    this.getReservationData();
  }
  validMessage: string = '';
  openConfirmSaveModal() {

    if (this.ishas === true) {
      const confirmModal = document.getElementById('confirmSaveModal');
      if (confirmModal) {
        confirmModal.classList.add('show');
        confirmModal.style.display = 'block';
      }
       const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
    } else {
      this.validMessage = 'Chưa xếp đủ bàn cho số lượng khách';
      setTimeout(() => {
        this.validMessage = '';
      }, 3000);
    }

    console.log(this.selectedTableIds);

  }

  closeConfirmSaveModal() {
    const confirmModal = document.getElementById('confirmSaveModal');
    if (confirmModal) {
      confirmModal.classList.remove('show');
      confirmModal.style.display = 'none';
    }
    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  confirmSave() {
    const request = {
      reservationId: this.reserId,
      tableIds: this.selectedTableIds
    }
    if (this.tableOfReservation.length > 0) {
      this.reservationService.updateTableReservation(request).subscribe({
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
          this.getReservationData();
        }
      });
    } else {
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
          this.getReservationData();
        }
      });
    }
    this.getReservationData();
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
        console.log(response);
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
    this.isModalVisibles = false;
  }
  confirmReservation(): void {
    this.onConfirmCallback();
  }
  cancelReservation(): void {
    this.closeModal();
  }
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
          this.isClose = true;
          setTimeout(() => {
            this.messageerrorTable = '';
          }, 3000);
          console.log(this.messageerrorTable);
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
          this.closeModal();
          this.getTableData();
          this.getReservation();
          this.getReservationData();
        },
        error => {
          console.error('Lỗi khi cập nhật trạng thái:', error);
        }
      );
    } else {
      this.errorMessages = 'Không thể nhận bàn nhận bàn vì chưa đến ngày nhận bàn ';
      this.isClose = true;
      setTimeout(() => {
        this.errorMessages = '';
      }, 3000);
    }
  }

  updateErrorMessage(index: number, message: string) {
    this.errorMessages = message;
  }

  findTableIdsByReservationId(reservationId: number): number[] {
    const reservation = this.dataReservationAccept.find((item: { reservationId: number; }) => item.reservationId === reservationId);
    if (reservation) {
      return reservation.tableOfReservation.map((table: { tableId: any; }) => table.tableId);
    }
    return [];
  }

  updateStatusReservationById(id: number, status: number, reservationTime: string, number: number): void {
    this.reservationService.checkValidTable(reservationTime, number).subscribe({
      next: response => {
        this.isValid = response.canReserve;
        console.log(response);
        if (this.isValid === true) {
          this.reservationService.updateStatusReservation(id, status).subscribe(
            response => {
              const body = {
                reservationId: id,
                acceptBy: this.accountId
              }
              this.reservationService.updateAcceptBy(body).subscribe(
                response => {
                  console.log(response);
                },
                error => {
                  console.error('Lỗi khi cập nhật trạng thái:', error);
                  if (error.error && error.error.errors) {
                    console.error('Lỗi xác thực:', error.error.errors);
                  }
                }
              );
              this.getReservation();
            },
            error => {
              console.error('Lỗi khi cập nhật trạng thái:', error);
              if (error.error && error.error.errors) {
                console.error('Lỗi xác thực:', error.error.errors);
              }
            }
          );
          this.closeAcceptModal();
        } else {
          this.message = response.message;
          setTimeout(() => {
            this.message = '';
          }, 3000);
        }
        console.log(this.message);
      },
      error: error => {
        console.error('An error occurred:', error.error.message);
        this.message = 'Có lỗi xảy ra khi kiểm tra bàn, vui lòng thử lại.';  // Thông báo lỗi
      }
    });
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
      acc[table.floor].push(table.lable);
      return acc;
    }, {});

    return Object.keys(groupedTables).map(floor => {
      const tableIds = groupedTables[floor];
      tableIds.sort((a: number, b: number) => a - b); // Sort table IDs
      let tableRange = '';
      if (tableIds.length === 1) {
        tableRange = `${tableIds[0]}`;
      } else {
        tableRange = `${tableIds[0]},${tableIds[tableIds.length - 1]}`;
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
    return grouped.map(group => `${group.floor}: ${group.tableRange}`).join('<br>');
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
      console.log(startIndex);
      console.log(endIndex);
      console.log(this.totalItems);
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

  tableEmpty: any[] = [];
  tableOfReservation: any;
  getTableDataEmpty(date: string): void {
    this.reservationService.getTable(date).subscribe(
      response => {
        if (Array.isArray(response)) {
          const newTables = response.filter((table: { floor: string; }) => table.floor === this.selectedFloor);
          this.tableEmpty = [...this.tableEmpty, ...newTables];
        } else {
          console.error('Error: Expected an array of tables');
        }
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  getTableOFFloorEmpty(floor: any, time: any): void {
    this.selectedFloor = floor;
    this.tableEmpty = [];
    this.getTableDataEmpty(time);
    if (this.tableOfReservation && this.tableOfReservation.length > 0) {
      this.tableOfReservation.forEach((reservation: { tableId: any; tableName: any; capacity: any; floor: any; lable: any; }) => {
        const table = {
          tableId: reservation.tableId,
          capacity: reservation.capacity,
          floor: reservation.floor,
          lable: reservation.lable
        };
        if (!this.tableEmpty.some(t => t.tableId === table.tableId)) {
          this.tableEmpty.push(table);
        }
      });
    }
    this.tableEmpty = this.tableEmpty.filter((table: { floor: any; }) => table.floor === this.selectedFloor);
    this.tableEmpty.sort((a: { tableId: number }, b: { tableId: number }) => a.tableId - b.tableId);
  }

  getSelectedTableNames(): string[] {
    if (Array.isArray(this.allTable)) {
      return this.allTable
        .filter(table => this.selectedTableIds.includes(table.tableId))
        .map(table => table.lable);
    }
    return [];
  }
  removeTable(index: number): void {

    const tableName = this.getSelectedTableNames()[index];
    const tableToRemove = this.allTable.find((table: { lable: string; }) => table.lable === tableName);
    if (tableToRemove) {
      // Remove the table ID from selectedTableIds
      this.selectedTableIds = this.selectedTableIds.filter(id => id !== tableToRemove.tableId);
      this.ishas = false;
      this.totalCapacity -= tableToRemove.capacity;
    }
  }

  getReservationClass(reservationTime: Date): string {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // Thời gian hiện tại + 1 giờ

    // Điều kiện 1: reservationTime đã qua => màu xám
    if (new Date(reservationTime) < now) {
      return 'reservation-gray';
    }

    // Điều kiện 2: reservationTime lớn hơn time now và <= 1 giờ => màu đỏ
    if (new Date(reservationTime) <= oneHourLater) {
      return 'reservation-red';
    }

    // Điều kiện 3: reservationTime lớn hơn 1 giờ so với hiện tại => không làm gì
    return '';
  }

  createNotification(orderId: number, check: number, accountId: number) {
    let description;
    let body;
    if (check === 1) {
      description = "Chúng tôi xin chân thành cảm ơn Quý Khách đã đặt bàn tại Eating House. Chúng tôi rất vui mừng thông báo rằng đơn đặt bàn của Quý Khách đã được chấp nhận và đang được xử lý. Chúng tôi sẽ cố gắng và đảm bảo rằng Quý Khách sẽ hài lòng với dịch vụ của chúng tôi. Nếu có bất kỳ câu hỏi nào hoặc cần thay đổi đơn hàng, xin vui lòng liên hệ với chúng tôi qua số điện thoại 0123456789 hoặc email eattinghouse@gmail.com. Cảm ơn Quý Khách đã chọn Eating House. Chúng tôi rất mong được phục vụ Quý Khách!"
      body = {
        description: description,
        accountId: accountId,
        orderId: orderId,
        type: 1
      }
    } else if (check === 2) {
      description = `Kính gửi Quý Khách. Chúng tôi rất tiếc phải thông báo rằng đơn đặt bàn của Quý Khách tại Eating House đã bị hủy. Lý do hủy đơn: ${this.cancelReason}. Chúng tôi thành thật xin lỗi về sự bất tiện này và mong rằng Quý Khách sẽ thông cảm. Chúng tôi luôn cố gắng cải thiện dịch vụ của mình để mang đến cho Quý Khách những trải nghiệm tốt nhất. Nếu Quý Khách cần thêm thông tin hoặc muốn đặt lại đơn hàng, vui lòng liên hệ với chúng tôi qua số điện thoại 0123456789 hoặc email eattinghouse@gmail.com. Cảm ơn Quý Khách đã hiểu và đồng hành cùng Eating House. `;
      body = {
        description: description,
        accountId: accountId,
        orderId: orderId,
        type: 1
      }
    }
    this.makeReservation(description);
    this.notificationService.createNotification(body).subscribe(
      response => {
        console.log(response);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  lastSentMessageId: any;
  makeReservation(reservationData: any) {
    this.lastSentMessageId = Date.now();
    const body = {
      lastSentMessageId: this.lastSentMessageId,
      reservationData: reservationData
    }
    const message = JSON.stringify(body);
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else if (this.socket.readyState === WebSocket.CONNECTING) {
      this.reservationQueue.push(message);
    } else {
      console.log('WebSocket is not open. Current state:', this.socket.readyState);
    }
  }

  //===========================================================================================================================

  updateTimes(): void {
    const now = new Date();
    const selectedDate = new Date(this.reservation.date);
    const isToday = now.toDateString() === selectedDate.toDateString();
    now.setMinutes(now.getMinutes() + 30);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    this.availableTimes = [];

    for (let hour = 9; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (!isToday || (hour > currentHour || (hour === currentHour && minute >= currentMinute))) {
          this.addTimeOption(hour, minute);
        }
      }
    }
  }
  addTimeOption(hour: number, minute: number): void {
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    this.availableTimes.push(formattedTime);
  }
  getTotalPrice(item: any): number {
    const price = item.discountedPrice != null ? item.discountedPrice : item.price;
    return parseFloat((item.quantity * price).toFixed(2));
  }
  submitForm(form: any) {
    this.formSubmitted = true;
    if (form.valid) {
      let dateTime = this.formatDateTime(this.reservation.date, this.reservation.time);
      const request = {
        accountId: this.accountId,
        guestPhone: this.guestPhone,
        email: this.emailGuest,
        guestAddress: '',
        consigneeName: this.consigneeName,
        reservationTime: dateTime,
        guestNumber: this.reservation.people,
        note: this.note,
        orderDate: new Date().toISOString(),
        status: 2,
        recevingOrder: dateTime,
        totalAmount: this.getTotalCartPrice(),
        deposits: 0,
        type: 3,
        orderDetails: this.cartItems.map(item => ({
          unitPrice: this.getTotalPrice(item),
          quantity: item.quantity,
          dishId: item.dishId,
          comboId: item.comboId,
          orderTime: new Date().toISOString()
        }))
      };
      this.currentRequest = request;
      const today = new Date();
      console.log(request);

      if (this.reservation.date === this.formatDate(today)) {
        const data = {
          comboIds: this.cartItems.map(item => item.comboId).filter(id => id !== undefined),
          dishIds: this.cartItems.map(item => item.dishId).filter(id => id !== undefined)
        };
        if (data.comboIds.length > 0 || data.dishIds.length > 0) {
          this.checkoutService.getRemainingItems(data).subscribe(response => {
            this.messages = []; // Đặt lại messages
            for (const combo of response.combos) {
              const itemInCart = this.cartItems.find(item => item.comboId === combo.comboId);
              if (itemInCart && combo.quantityRemaining < itemInCart.quantity) {
                this.messages.push(`Không đủ số lượng món ăn: ${combo.name}. Số lượng yêu cầu: ${itemInCart.quantity}, Số lượng còn lại: ${combo.quantityRemaining}`);
                this.isValidDish = true;
              }
            }
            for (const dish of response.dishes) {
              const itemInCart = this.cartItems.find(item => item.dishId === dish.dishId);
              if (itemInCart && dish.quantityRemaining < itemInCart.quantity) {
                this.messages.push(`Không đủ số lượng món ăn: ${dish.name}. Số lượng yêu cầu: ${itemInCart.quantity}, Số lượng còn lại: ${dish.quantityRemaining}`);
                this.isValidDish = true;
              }
            }

            if (this.messages.length > 0) {
              setTimeout(() => {
                this.messages = [];
              }, 3000);
              return;
            }
            this.openConfirmModal();
          }, error => {
            console.error('Error during payment initiation', error);
          });
          return;
        }
        else {
          this.openConfirmModal();
        }
      }
      else {
        this.openConfirmModal();
      }
    }
  }
  isConfirmModalOpen = false;
  openConfirmModal() {
    this.isConfirmModalOpen = true;
    console.log(this.selectedTableIds);
  }
  closeConfirmModal() {
    this.isConfirmModalOpen = false;
  }
  errorTime: string = '';
  checkAvailability() {
    console.log(this.reservation.time);
    if (this.reservation.time.trim() === '') {
      this.errorTime = 'Vui lòng chọn giờ ăn!';
      setTimeout(() => {
        this.errorTime = '';
      }, 3000);
      return;
    }
    this.dateTime = this.formatDateTime(this.reservation.date, this.reservation.time);
    console.log(this.dateTime, this.reservation.people);

    this.reservationService.checkValidTable(this.dateTime, this.reservation.people).subscribe({
      next: response => {
        this.showPersonalInfo = response.canReserve;
        this.formChanged = false;
        console.log(response);
        if (this.showPersonalInfo === false) {
          this.message = response.message;
          setTimeout(() => {
            this.message = '';
          }, 3000);
        }
      },
      error: error => {
        console.error('An error occurred:', error.error.message);
        this.message = 'Có lỗi xảy ra khi kiểm tra bàn, vui lòng thử lại.';
      }
    });
  }
  onFormChange() {
    this.formChanged = true;
    console.log(this.formChanged);
    this.showPersonalInfo = false;
    this.selectedFloor = this.dataTable[0].floor;
    this.selectedTableIds = [];
    this.ishas = false;
    this.totalCapacity = 0;
    console.log(this.selectedTableIds);


  }
  formatDateTime(date: string, time: string): string {
    const datetimeString = `${date}T${time}:00`;
    const dateObj = new Date(datetimeString);

    const localTimezoneOffset = dateObj.getTimezoneOffset();

    const localDateObj = new Date(dateObj.getTime() - localTimezoneOffset * 60000);

    const formattedDateTime = localDateObj.toISOString().slice(0, 19);

    return formattedDateTime;
  }
  reset:boolean=true;
  createReservation() {
    const today = new Date();
    this.reservationService.createResevetion(this.currentRequest).subscribe({
      next: response => {
        console.log('Order submitted successfully', response);
        this.reservationService.clearCart();
        const request = {
          reservationId: response.reservation.reservationId,
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
            this.getReservationData();
          }
        });
        this.closeConfirmModal();
        this.reservation = {
          name: '',
          phone: '',
          email: '',
          date: this.formatDate(today),
          time: '',
          people: 2,
          notes: ''
        };
        this.reset=false;
        this.updateTimes();
        this.showPersonalInfo = false;
        this.selectedFloor = this.dataTable[0].floor;
        this.selectedTableIds = [];
        this.ishas = false;
        this.totalCapacity = 0;
        this.getReservationData();
        this.addSuccessMessage('Tạo đơn đặt bàn thành công');
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

  }

  assignTable(dateTime: any) {
    this.reservationTimeSelected = dateTime;
    const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
    this.selectedTable = 'all';
    this.selectedFloor = this.dataTable[0].floor;
    console.log(dateTime);
    this.guestNumber = this.reservation.people;
    this.getTableOFFloorEmpty(this.selectedFloor, dateTime);
  }
  closeTableAssignPopup() {
    if (this.ishas === true) {
      const confirmModal = document.getElementById('confirmSaveModal');
      if (confirmModal) {
        confirmModal.classList.add('show');
        confirmModal.style.display = 'block';
      }
       const modal = document.getElementById('updateTimeModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
    } else {
      this.validMessage = 'Chưa xếp đủ bàn cho số lượng khách';
      setTimeout(() => {
        this.validMessage = '';
      }, 3000);
    }
    // this.showPersonalInfo = false;
  }
  openMenuPopup(): void {
    this.isMenuPopupOpen = true;
    console.log('Modal Opened:', this.isMenuPopupOpen);
  }
  closeMenuPopup(): void {
    this.isMenuPopupOpen = false;
    console.log('Modal Closed:', this.isMenuPopupOpen);
  }
  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
      this.reservationService.updateCart(this.cartItems);
    }
  }

  increaseQuantity(item: any) {
    item.quantity++;
    this.reservationService.updateCart(this.cartItems);
  }
  calculateItemQuantity() {
    this.itemQuantityMap = {};
    this.cartItems.forEach(item => {
      const itemName = item.itemName;
      this.itemQuantityMap[itemName] = item.quantity;
    });
  }
  getTotalCartPrice(): number {
    return parseFloat(this.cartItems.reduce((total, item) => {
      const price = item.discountedPrice != null ? item.discountedPrice : item.price;
      return total + (price * item.quantity);
    }, 0).toFixed(2));
  }
  removeItem(item: any) {
    if (item.hasOwnProperty('dishId')) {
      this.reservationService.removeFromCart(item.dishId, 'Dish');
    } else if (item.hasOwnProperty('comboId')) {
      this.reservationService.removeFromCart(item.comboId, 'Combo');
    }
  }
  validateInput(item: any, maxValue: number) {
    const value = parseInt(item.quantity, 10);
    if (isNaN(value) || value < 1) {
      item.quantity = 1;
    } else if (value > maxValue) {
      item.quantity = maxValue;
    }
  }

  preventDelete(event: KeyboardEvent, currentQuantity: number) {
    if (currentQuantity <= 1 && (event.key === 'Backspace' || event.key === 'Delete')) {
      event.preventDefault();
    }
    if (currentQuantity >= this.maxValue) {
      if (event.key !== 'Backspace' && event.key !== 'Delete') {
        event.preventDefault();
      }
      return;
    }
    const validKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (validKeys.indexOf(event.key) !== -1 || /^[0-9]$/.test(event.key)) {
      return;
    }
    event.preventDefault();
  }
}


