import { CommonModule } from "@angular/common";
import { OnInit, ElementRef, ViewChild, Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CookingService } from "../../../../service/cooking.service";
import { ExportService } from "../../../../service/export.service";
import { InvoiceService } from "../../../../service/invoice.service";
import { NotificationService } from "../../../../service/notification.service";
import { CurrencyFormatPipe } from "../../../common/material/currencyFormat/currencyFormat.component";
import { HeaderOrderStaffComponent } from "../../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";
import { SidebarOrderComponent } from "../../SidebarOrder/SidebarOrder.component";
import { Title } from "@angular/platform-browser";

@Component({
  selector: 'app-refund',
  templateUrl: './refund.component.html',
  styleUrls: ['./refund.component.css'],
  standalone: true,
  imports: [HeaderOrderStaffComponent, SidebarOrderComponent, FormsModule, CommonModule, CurrencyFormatPipe]
})
export class RefundComponent implements OnInit {
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

  constructor(private invoiceService: InvoiceService, private notificationService: NotificationService, private cookingService: CookingService, private exportService: ExportService, private titleService: Title) { }
  @ViewChild('collectAllModal') collectAllModal!: ElementRef;
  ngOnInit() {
    this.titleService.setTitle('Đơn hoàn tiền | Eating House');
    this.getOrdersCancel();
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    this.selectedStatusFun = 'unrefun';
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
  getOrdersCancel(): void {
    this.invoiceService.getCancelOrder().subscribe(
      response => {
        this.orderCancel = response;
        this.filteredOrdersCancel = [...this.orderCancel]; // Make a copy of orderCancel
        console.log(response);
        console.log(this.selectedStatusFun);

        this.filterOrdersByStatus();

      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  selectedStatusFun: string | null = null;
  filterOrdersByStatus(): void {
    if (this.selectedStatusFun === 'refun') {
      this.filteredOrdersCancel = this.orderCancel.filter(  // Filter the original orderCancel array
        (order: { status: number }) => order.status === 8
      );
    } else if (this.selectedStatusFun === 'unrefun') {
      this.filteredOrdersCancel = this.orderCancel.filter(
        (order: { status: number }) => order.status === 5
      );
    }

    console.log("Filtered Orders by Status:", this.filteredOrdersCancel);
  }

  // Mở modal
  openModal(): void {
    const modal = this.collectAllModal.nativeElement;
    modal.classList.add('show');
    modal.style.display = 'block';
    modal.setAttribute('aria-modal', 'true');
    modal.removeAttribute('aria-hidden');
  }

  // Đóng modal
  closeModal(): void {
    const modal = this.collectAllModal.nativeElement;
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
  }




  updateOrderStatus(id: number, accountId: number): void {
    const request = {
      status: 8
    }
    this.invoiceService.updateOrderStatus(id, request).subscribe(
      response => {
        console.log(response, request);
        const body = {
          orderId: id,
          staffId: this.accountId
        }
        console.log(body);

        this.createNotification(id, accountId, true);
        this.invoiceService.updateStaffId(body).subscribe(
          response => {
            this.getOrdersCancel();
          },
          error => {
            console.error('Error:', error);
            this.getOrdersCancel();
          }
        );
        this.getOrdersCancel();
      },
      error => {
        console.error('Error:', error);
      }
    );
    this.getOrdersCancel();

  }
  employ: any;
  showDetails(order: any) {
    console.log(order);
    this.employ = order;
    this.getOrdersDetail(order.orderId);
  }

  closePopup() {
    this.selectedItem = null;
  }
  getOrdersDetail(id: number): void {
    this.invoiceService.getOrderDetail(id).subscribe(
      response => {
        this.selectedItem = response;
        console.log(response);

      },
      error => {
        console.error('Error:', error);

      }
    );
  }
  orderCancelMoney: any;
  getOrderCancel(data: any) {
    this.orderCancelMoney = data;
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
}


