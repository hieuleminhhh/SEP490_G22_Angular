import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../../common/material/currencyFormat/currencyFormat.component';
import { HeaderOrderStaffComponent } from '../../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component';
import { SidebarOrderComponent } from '../../SidebarOrder/SidebarOrder.component';
import { CookingService } from '../../../../service/cooking.service';
import { ExportService } from '../../../../service/export.service';
import { InvoiceService } from '../../../../service/invoice.service';
import { NotificationService } from '../../../../service/notification.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.css'],
  standalone: true,
  imports: [HeaderOrderStaffComponent, SidebarOrderComponent, FormsModule, CommonModule, CurrencyFormatPipe]
})
export class DeliveryComponent implements OnInit {
  selectedTab: string = 'overview';
  data: any;
  orderCancel: any;
  orderShip: any;
  selectedItem: any;

  filteredOrders: any[] = [];
  filteredOrdersCancel: any[] = [];
  selectedEmployee: string = '';
  employees: any[] = [];

  dateFrom: string = '';
  dateTo: string = '';
  dateNow: string = '';
  selectedEmployeeName: string = '';
  orders: any;
  accountId: any;
  private reservationQueue: any[] = [];
  private socket!: WebSocket;

  constructor(private invoiceService: InvoiceService, private notificationService: NotificationService, private cookingService: CookingService, private exportService: ExportService,private titleService: Title ) { }
  @ViewChild('collectAllModal') collectAllModal!: ElementRef;
  ngOnInit() {
    this.titleService.setTitle('Đơn thu tiền | Eating House');
    this.getOrdersShip();
    this.getEmployees();
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    this.selectedStatus = 'unpaid';
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
      while (this.reservationQueue.length > 0) {
        this.socket.send(this.reservationQueue.shift());
      }
    };
    this.socket.onclose = () => {
      console.log('WebSocket connection closed, attempting to reconnect...');
      setTimeout(() => {
        this.initializeWebSocket(); // Hàm khởi tạo WebSocket
      }, 5000); // Thử lại sau 5 giây
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
  createNotification(orderId: number, accountId: number, check: boolean) {
    let description;
    if (check === true) {
      description = `Kính gửi Quý Khách. Chúng tôi xin thông báo rằng đơn hàng của Quý Khách tại Eating House với mã đơn hàng ${orderId} đã được hoàn tiền thành công. Số tiền sẽ được hoàn lại qua phương thức thanh toán mà Quý Khách đã sử dụng khi đặt hàng. Xin vui lòng kiểm tra tài khoản của mình để xác nhận giao dịch. Chúng tôi thành thật xin lỗi vì bất kỳ sự bất tiện nào mà điều này có thể đã gây ra. Nếu Quý Khách có bất kỳ thắc mắc nào liên quan đến việc hoàn tiền, vui lòng liên hệ với chúng tôi qua số điện thoại 0123456789 hoặc email eattinghouse@gmail.com. Cảm ơn Quý Khách đã tin tưởng và sử dụng dịch vụ của Eating House. Chúng tôi hy vọng sẽ có cơ hội được phục vụ Quý Khách trong tương lai!`;
    } else {
      description = `Đã nhận tiền giao hàng cho đơn hàng ${orderId}`;
    }
    const body = {
      description: description,
      accountId: accountId,
      orderId: orderId,
      type: 1
    }
    console.log(body);

    this.notificationService.createNotification(body).subscribe(
      response => {
        console.log(response);
        this.makeReservation(body.description);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }

  makeReservation(reservationData: any) {
    const message = JSON.stringify(reservationData);
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message); // Gửi yêu cầu đặt bàn khi WebSocket đã mở
    } else if (this.socket.readyState === WebSocket.CONNECTING) {
      this.reservationQueue.push(message);
    } else {
      console.log('WebSocket is not open. Current state:', this.socket.readyState);
    }
  }

  getOrdersShip(): void {
    this.invoiceService.getOrderShip().subscribe(
      response => {
        this.orderShip = response;
        this.filterOrders();
        console.log(this.orderShip);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  selectedStatus: string | null = null;
  filterOrders(): void {
    console.log("Selected Employee ID:", this.selectedEmployee);
    this.filteredOrders = this.orderShip;

    if (this.selectedEmployee) {
      this.filteredOrders = this.filteredOrders.filter(
        (order: { staffId: number }) => order.staffId === Number(this.selectedEmployee)
      );
    }

    if (this.selectedStatus) {
      if (this.selectedStatus === 'paid') {
        this.filteredOrders = this.filteredOrders.filter(
          (order: { paymentStatus: number }) => order.paymentStatus === 1
        );
      } else if (this.selectedStatus === 'unpaid') {
        this.filteredOrders = this.filteredOrders.filter(
          (order: { paymentStatus: number }) => order.paymentStatus === 0
        );
      }
    }
    console.log("Filtered Orders:", this.filteredOrders);
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
      console.log(this.selectedEmployeeName);

    }
  }
  openModal(): void {
    const modal = this.collectAllModal.nativeElement;
    modal.classList.add('show');
    modal.style.display = 'block';
    modal.setAttribute('aria-modal', 'true');
    modal.removeAttribute('aria-hidden');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }
  closeModal(): void {
    const modal = this.collectAllModal.nativeElement;
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }


  // Xác nhận thu tất cả
  collectAllPayments(): void {
    const updatePromises = this.filteredOrders.map(order =>
      new Promise<void>((resolve, reject) => {
        this.update(order.orderId, order.totalPaid, this.orderShipper.staffId);
        resolve(); // Hoàn tất promise ngay lập tức (có thể thêm logic kiểm tra ở đây)
      })
    );

    Promise.all(updatePromises)
      .then(() => {
        this.closeModal();
        window.location.reload();
      })
      .catch(error => {
        console.error('Error collecting payments:', error);
      });
  }

  update(id: number, totalPaid: number, staffId: number): void {
    const request = {
      paymentAmount: totalPaid,
      collectedBy: this.accountId
    };

    this.invoiceService.updatePayment(id, request).subscribe(
      response => {
        this.filteredOrders = this.filteredOrders.filter(order => order.orderId !== id);
        console.log(`Đơn hàng ${id} đã được thu tiền.`);
        this.createNotification(id, staffId, false);
        this.getOrdersShip();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
employ:any;
  showDetails(order: any) {
    console.log(order);
    this.employ=order;
    this.getOrdersDetail(order.orderId);
  }

  closePopup() {
    this.selectedItem = null;
  }
  getOrdersDetail(id: number): void {
    this.invoiceService.getOrderDetail(id).subscribe(
      response => {
        this.selectedItem = response;
      },
      error => {
        console.error('Error:', error);

      }
    );
  }
  orderShipper: any;
  getOrderShip(data: any) {
    this.orderShipper = data;
  }
}

