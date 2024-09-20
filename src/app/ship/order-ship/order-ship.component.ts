import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { CookingService } from '../../../service/cooking.service';
import { HeaderOrderStaffComponent } from "../../staff/ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";
import { InvoiceService } from '../../../service/invoice.service';
import { NotificationService } from '../../../service/notification.service';

@Component({
  selector: 'app-order-ship',
  standalone: true,
  templateUrl: './order-ship.component.html',
  styleUrls: ['./order-ship.component.css'],
  imports: [CommonModule, FormsModule, CurrencyFormatPipe, HeaderOrderStaffComponent]
})
export class OrderShipComponent implements OnInit {

  constructor(private cookingService: CookingService, private invoiceService: InvoiceService, private notificationService: NotificationService) { }
  deliveryOrders: any[] = [];
  selectedItem: any;
  accountId: any;
  cancelationReason: string = '';
  errorMessage: string = '';
   private socket!: WebSocket;
  private reservationQueue: any[] = [];

  ngOnInit() {
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    console.log(this.accountId);

    this.getListShip(this.accountId);
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
      while (this.reservationQueue.length > 0) {
        this.socket.send(this.reservationQueue.shift());
      }
    };
    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
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

  showDetails(order: any) {
    console.log(order);
    this.selectedItem = order;
  }

  closePopup() {
    this.selectedItem = null;
  }

  getListShip(accountId: number) {
    this.cookingService.getListShip(7, accountId).subscribe(
      response => {
        this.deliveryOrders = response;
        console.log(this.deliveryOrders);

      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  completeOrder(order: any) {
    const request = {
      status: 4
    };
    this.cookingService.updateOrderStatus(order.orderId, request).subscribe(
      response => {
        if (order.deposits > 0) {
          this.createNotification(order.orderId, 1, order.accountId);
          this.createNotification(order.orderId, 3, order.accountId);
          this.update(order.orderId, order.deposits);
        }
        window.location.reload();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  cancelOrder(order: any) {
    const request = {
      status: 5
    };
    if (this.cancelationReason.trim() === '') {
      this.errorMessage = 'Vui lòng nhập lý do hủy đơn hàng';
      return;
    }
    this.errorMessage = '';
    this.cookingService.updateOrderStatus(order.orderId, request).subscribe(
      response => {
        const body = {
          cancelationReason: this.cancelationReason,
          cancelBy: "Nhân viên ship"
        }
        this.cookingService.updatecancelReason(order.orderId, body).subscribe(
          response => {
            this.createNotification(order.orderId, 2, order.accountId);
            this.createNotification(order.orderId, 4, order.accountId);
          },
          error => {
            console.error('Error:', error);
          }
        );
        window.location.reload();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  createNotification(orderId: number, check: number, accountId: number) {
    let description;
    let body;
    if (check === 1) {
      description = "Chúng tôi xin chân thành cảm ơn Quý Khách đã đặt hàng tại Eating House. Chúng tôi rất vui mừng thông báo rằng đơn đặt hàng của Quý Khách đã được giao hàng thành công.Chúng tôi mong rằng Quý Khách sẽ hài lòng với những món ăn mà chúng tôi đã chuẩn bị. Nếu có bất kỳ câu hỏi nào hoặc cần thay đổi đơn hàng, xin vui lòng liên hệ với chúng tôi qua số điện thoại 0123456789 hoặc email eattinghouse@gmail.com. Cảm ơn Quý Khách đã chọn Eating House. Chúng tôi rất mong được phục vụ Quý Khách!"
      body = {
        description: description,
        accountId: accountId,
        orderId: orderId,
        type: 1
      }
    } else if (check === 2) {
      description = `Kính gửi Quý Khách. Chúng tôi rất tiếc phải thông báo rằng đơn đặt hàng của Quý Khách tại Eating House với mã đơn hàng ${orderId} đã bị hủy. Lý do hủy đơn hàng: ${this.cancelationReason}. Chúng tôi thành thật xin lỗi về sự bất tiện này và mong rằng Quý Khách sẽ thông cảm. Chúng tôi luôn cố gắng cải thiện dịch vụ của mình để mang đến cho Quý Khách những trải nghiệm tốt nhất. Nếu Quý Khách cần thêm thông tin hoặc muốn đặt lại đơn hàng, vui lòng liên hệ với chúng tôi qua số điện thoại 0123456789 hoặc email eattinghouse@gmail.com. Cảm ơn Quý Khách đã hiểu và đồng hành cùng Eating House. `;
      body = {
        description: description,
        accountId: accountId,
        orderId: orderId,
        type: 1
      }
    }
    else if (check === 3) {
      description = `Đơn hàng ${orderId} đã được giao thành công. `;
      body = {
        description: description,
        orderId: orderId,
        type: 2
      }
    }
    else if (check === 4) {
      description = `Đơn hàng ${orderId} đã giao hàng thất bại. Lý do ${this.cancelationReason} `;
      body = {
        description: description,
        orderId: orderId,
        type: 2
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

  update(id: number, deposits: number): void {
    const request = {
      paymentAmount: deposits
    }
    this.invoiceService.updatePayment(id, request).subscribe(
      response => {
        window.location.reload();

      },
      error => {
        console.error('Error:', error);

      }
    );
  }
  orderShipper: any;
  getOrderShip(data: any) {
    console.log(data);

    this.orderShipper = data;
  }

}
