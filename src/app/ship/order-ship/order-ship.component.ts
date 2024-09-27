import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { CookingService } from '../../../service/cooking.service';
import { HeaderOrderStaffComponent } from "../../staff/ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";
import { InvoiceService } from '../../../service/invoice.service';
import { NotificationService } from '../../../service/notification.service';
import { ManagerOrderService } from '../../../service/managerorder.service';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-order-ship',
  standalone: true,
  templateUrl: './order-ship.component.html',
  styleUrls: ['./order-ship.component.css'],
  imports: [CommonModule, FormsModule, CurrencyFormatPipe, HeaderOrderStaffComponent]
})
export class OrderShipComponent implements OnInit {

  constructor(private cookingService: CookingService, private invoiceService: InvoiceService, private notificationService: NotificationService, private orderService: ManagerOrderService) { }
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
  async completeOrder(order: any): Promise<void> {
    const request = {
      status: 4
    };

    try {
      // Tạo thông báo
      this.createNotification(order.orderId, 1, order.accountId);
      this.createNotification(order.orderId, 3, order.accountId);

      // Cập nhật trạng thái đơn hàng
      await firstValueFrom(this.cookingService.updateOrderStatus(order.orderId, request));

      if (order.deposits > 0) {
        // Nếu `this.update` không trả về `Observable`, gọi trực tiếp mà không sử dụng `firstValueFrom`
        this.update(order.orderId, order.deposits); // Không cần `await` hoặc `firstValueFrom` nếu nó không phải `Observable`
      }

      // Gọi API để lấy thông tin email khách hàng
      const emailResponse = await firstValueFrom(this.orderService.sendOrderEmail(order.orderId));
      const customerEmail = emailResponse.email;
      const consigneeName = emailResponse.consigneeName;
      const deliveryDate = new Date().toLocaleDateString(); // Ngày giao hàng
      const deliveryTime = new Date().toLocaleTimeString(); // Giờ giao hàng
      const supportPhone = emailResponse.phone; // Thay thế bằng số điện thoại hỗ trợ thực tế
      const supportEmail = emailResponse.settingEmail; // Thay thế bằng địa chỉ email hỗ trợ thực tế
      const companyName = emailResponse.eateryName; // Tên công ty

      // Gửi email thông báo giao hàng thành công
      await firstValueFrom(this.orderService.sendEmail(
        customerEmail,
        'Thông Báo Giao Hàng Thành Công Từ Eating House',
        `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <p>Kính gửi <strong>${consigneeName}</strong>,</p>
          <p>Chúng tôi xin thông báo rằng đơn hàng của bạn đã được giao thành công vào ngày <strong>${deliveryDate}</strong> lúc <strong>${deliveryTime}</strong>.</p>
          <p>Quý khách có thể xem chi tiết đơn hàng của mình tại đường dẫn sau: 
          <a href="http://localhost:4200/orderDetail/${order.orderId}" style="color: blue; text-decoration: underline;">Xem chi tiết đơn hàng tại đây</a>.</p>
          <p>Chúng tôi rất vui khi được phục vụ bạn và hy vọng bạn hài lòng với sản phẩm. Nếu có bất kỳ thắc mắc hoặc phản hồi nào, xin vui lòng liên hệ với chúng tôi qua số điện thoại <strong>${supportPhone}</strong> hoặc email <strong>${supportEmail}</strong>.</p>
          <p>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi.</p>
          <p>Trân trọng,<br>${companyName}<br>${supportPhone}</p>
        </div>`
      ));

      console.log('Email sent successfully');

      // Reload trang sau khi hoàn thành
      window.location.reload();

    } catch (error) {
      console.error('Error completing order or sending email:', error);
      // Xử lý lỗi nếu có
    }
  }


  async cancelOrder(order: any): Promise<void> {
    const request = {
      status: 5
    };

    if (this.cancelationReason.trim() === '') {
      this.errorMessage = 'Vui lòng nhập lý do hủy đơn hàng';
      return;
    }

    this.errorMessage = '';

    // Tạo thông báo
    this.createNotification(order.orderId, 2, order.accountId);
    this.createNotification(order.orderId, 4, order.accountId);

    try {
      // Cập nhật trạng thái đơn hàng
      await firstValueFrom(this.cookingService.updateOrderStatus(order.orderId, request));

      const body = {
        cancelationReason: this.cancelationReason,
        cancelBy: "Nhân viên ship"
      };

      // Cập nhật lý do hủy đơn hàng
      await firstValueFrom(this.cookingService.updatecancelReason(order.orderId, body));

      // Gọi API để lấy thông tin email khách hàng
      const emailResponse = await firstValueFrom(this.orderService.sendOrderEmail(order.orderId));
      const customerEmail = emailResponse.email;
      const consigneeName = emailResponse.consigneeName;
      const supportPhone = emailResponse.phone; // Thay thế bằng số điện thoại hỗ trợ thực tế
      const supportEmail = emailResponse.settingEmail; // Thay thế bằng địa chỉ email hỗ trợ thực tế
      const companyName = emailResponse.eateryName; // Tên công ty

      // Gửi email thông báo hủy đơn hàng
      await firstValueFrom(this.orderService.sendEmail(
        customerEmail,
        'Thông Báo Hủy Đơn Hàng Từ Eating House',
        `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <p>Kính gửi <strong>${consigneeName}</strong>,</p>
          <p>Chúng tôi xin thông báo rằng đơn hàng của bạn đã bị hủy bởi nhân viên giao hàng với lý do: <strong>${this.cancelationReason}</strong>.</p>
          <p>Nếu quý khách có bất kỳ thắc mắc hoặc yêu cầu nào, vui lòng liên hệ với chúng tôi qua số điện thoại <strong>${supportPhone}</strong> hoặc email <strong>${supportEmail}</strong>.</p>
          <p>Chân thành cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi.</p>
          <p>Trân trọng,<br>${companyName}<br>${supportPhone}</p>
        </div>`
      ));

      console.log('Email sent successfully');

      // Reload trang sau khi hoàn thành
      window.location.reload();
    } catch (error) {
      console.error('Error processing cancel order:', error);
      // Xử lý lỗi nếu có
    }
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
