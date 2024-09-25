import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HeaderOrderStaffComponent } from '../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component';
import { SidebarOrderComponent } from "../SidebarOrder/SidebarOrder.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../../service/invoice.service';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { CookingService } from '../../../service/cooking.service';
import { ExportService } from '../../../service/export.service';
import { NotificationService } from '../../../service/notification.service';
import { Title } from '@angular/platform-browser';

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

  constructor(private invoiceService: InvoiceService, private notificationService: NotificationService, private cookingService: CookingService, private exportService: ExportService, private titleService: Title) { }
  @ViewChild('collectAllModal') collectAllModal!: ElementRef;
  ngOnInit() {
    this.titleService.setTitle('Thống kê | Eating House');
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo = this.formatDate(today);
    this.dateNow = this.formatDate(today);
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    this.getNotificationByType(this.accountId);
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
    this.getOrdersStatic();
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
    }else{
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

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  onDateFromChange(): void {

    this.getOrdersStatic();
  }

  onDateToChange(): void {
    if (this.dateTo < this.dateFrom) {
      this.dateFrom = this.dateTo;
    }
    this.getOrdersStatic();
  }

  getOrdersStatic(): void {
    console.log(this.accountId);
    if(this.role!==3){
      this.accountId=null;
    }
    this.invoiceService.getStatistics(this.dateFrom, this.dateTo, this.accountId).subscribe(
      response => {
        this.data = response;
        console.log(this.data);
      },
      error => {
        console.error('Error:', error);

      }
    );
  }
  exportData(): void {
    this.getOrderExport();
  }
  role:any;
  getNotificationByType(accountId: number): void {
    this.notificationService.getType(accountId).subscribe(
      response => {
        this.role=response;
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  getOrderExport(): void {
    this.invoiceService.getOrderExport(this.data.orderIds).subscribe(
      response => {
        const flattenedData = this.flattenOrderData(response);
        console.log(flattenedData); // Kiểm tra dữ liệu đã bao gồm orderDetail chưa
        this.exportService.exportToExcel(flattenedData, 'orders');
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  flattenOrderData(orders: any[]): any[] {
    const flattenedData: any[] = [];

    orders.forEach(order => {
      const orderInfo = {
        orderId: order.orderId,
        orderDate: this.formatDateTime(order.orderDate),
        status: "Hoàn thành",
        recevingOrder: this.formatDateTime(order.recevingOrder),
        totalAmount: order.totalAmount,
        guestPhone: order.guestPhone,
        deposits: order.deposits,
        note: order.note,
        cancelationReason: order.cancelationReason,
        invoiceId: order.invoice?.invoiceId,
        paymentTime: this.formatDateTime(order.invoice?.paymentTime),
        paymentAmount: order.invoice?.paymentAmount,
        taxcode: order.invoice?.taxcode,
        paymentStatus: order.invoice?.paymentStatus,
        customerName: order.invoice?.customerName,
        invoicePhone: order.invoice?.phone,
        invoiceAddress: order.invoice?.address,
        addressId: order.address?.addressId,
        guestAddress: order.address?.guestAddress,
        consigneeName: order.address?.consigneeName,
        guestEmail: order.guest?.email,
      };

      // Lặp qua từng chi tiết đơn hàng và kết hợp với thông tin đơn hàng
      order.orderDetails.forEach((detail: { orderDetailId: any; dishName: string; unitPrice: number; quantity: number; dishesServed: any; }) => {
        flattenedData.push({
          ...orderInfo, // Gộp thông tin đơn hàng
          orderDetailId: detail.orderDetailId,
          dishName: detail.dishName,
          unitPrice: detail.unitPrice,
          quantity: detail.quantity,
          dishesServed: detail.dishesServed
        });
      });
    });

    return flattenedData;
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Không sử dụng định dạng 12 giờ
    });
  }
  selectedItem: any;
  showDetails(order: any) {
    console.log(order);
    this.selectedItem = order;
  }
  showDetailsCashier:boolean=false;

  showDetailCashier(){
    this.showDetailsCashier=true;
  }
  goBack(){
    this.showDetailsCashier=false;
  }
}
