import { Component, OnInit } from '@angular/core';
import { ManagerOrderService } from '../../../service/managerorder.service';
import { ListAllOrder } from '../../../models/order.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerOrderDetailService } from '../../../service/managerorderDetail.service';
import { ListOrderDetailByOrder } from '../../../models/orderDetail.model';
import { SidebarOrderComponent } from "../SidebarOrder/SidebarOrder.component";
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { DateFormatPipe } from '../../common/material/dateFormat/dateFormat.component';
import { HttpErrorResponse } from '@angular/common/http';
import { PercentagePipe } from '../../common/material/percentFormat/percentFormat.component';
import { InvoiceService } from '../../../service/invoice.service';
import { ItemInvoice } from '../../../models/invoice.model';
import { Table } from '../../../models/table.model';
import { AccountService } from '../../../service/account.service';
import { HeaderOrderStaffComponent } from "./HeaderOrderStaff/HeaderOrderStaff.component";
import { SettingService } from '../../../service/setting.service';
import { NotificationService } from '../../../service/notification.service';
import { DataService } from '../../../service/dataservice.service';
import { PaymentService } from '../../../service/payment.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-ManagerOrder',
  templateUrl: './ManagerOrder.component.html',
  styleUrls: ['./ManagerOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent, CurrencyFormatPipe, DateFormatPipe, PercentagePipe, HeaderOrderStaffComponent]
})
export class ManagerOrderComponent implements OnInit {
  orders: ListAllOrder[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  dateNow: string = '';
  search: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  selectedOrder: any = {};
  invoice: any = {};
  totalPagesArray: number[] = [];
  weeks: { start: string, end: string }[] = [];
  years: number[] = [];
  accountId: number | null = null;
  account: any;
  statuses = [
    { value: 1, text: 'Đang chờ' },
    { value: 2, text: 'Đã chấp nhận' },
    { value: 3, text: 'Đang phục vụ' },
    { value: 4, text: 'Hoàn thành' },
    { value: 5, text: 'Hủy' },
    { value: 6, text: 'Đang chuẩn bị' },  // Thanh toan Takeaway vs online
    { value: 7, text: 'Đang giao hàng' },
    { value: 8, text: 'Đã hoàn tiền' }  // online
  ];

  types = [
    { value: '1', text: 'Đơn mang về' },//thanh toan trc
    { value: '2', text: 'Đơn đặt ship' },// thanh toan trc
    { value: '3', text: 'Đơn đặt bàn trước' },
    { value: '4', text: 'Đơn ăn tại quán' }
  ];
  filterByDate = [
    { value: 'Đặt hàng', text: 'Đặt hàng' },
    { value: 'Giao hàng', text: 'Giao hàng' },
  ];
  selectedStatus: number = 0;
  selectedFilter: string = 'Đặt hàng';
  selectedType: number = 0;
  orderDetail: ListOrderDetailByOrder | null = null;
  orderId: number = 0;
  paymentMethod: string = '0';
  customerPaid: number | null = null;
  paymentAmount: number = 0;
  tables: Table[] = [];
  tableId: number | null = null;
  dishesServed: number = 0;
  totalQuantity: number = 0;
  cancelationReason: string = '';
  depositOrder: any;
  accountGuest: any;
  private socket!: WebSocket;
  notifications: string[] = [];
  isVisible: boolean[] = [];

  constructor(
    private orderService: ManagerOrderService,
    private orderDetailService: ManagerOrderDetailService,
    private router: Router,
    private route: ActivatedRoute,
    private invoiceService: InvoiceService,
    private accountService: AccountService,
    private settingService: SettingService, private notificationService: NotificationService,
    private dataService: DataService, private paymentService: PaymentService,
    private titleService: Title
  ) { }

  ngOnInit() {
    this.titleService.setTitle('Quản lý đơn hàng | Eating House');
    this.setDefaultDates();
    this.selectedType = 0;
    this.loadListOrder();
    this.paymentMethod = '0';
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;
    this.customerPaid = this.DiscountedTotalAmount();
    console.log('31', this.accountId);
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo = this.formatDate(today);
    this.dateNow = this.formatDate(today);
    this.getInfo();
    if (this.accountId) {
      this.getAccountDetails(this.accountId);
    } else {
      console.error('Account ID is not available');
    }

    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
      console.log('WebSocket connection opened');
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      try {
        this.loadListOrder();
        this.addSuccessMessage(data);
      } catch (error) {
        console.error('Error parsing reservation data:', error);
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
  setDefaultDates() {
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo = this.formatDate(today);
  }
  getOrder(orderId: number) {
    this.orderDetailService.getOrderDetail(orderId).subscribe(
      (response: ListOrderDetailByOrder) => {
        this.selectedOrder = response;
        console.log('Order details:', this.selectedOrder);
      },
      (error: HttpErrorResponse) => {
        console.error('Error fetching order details:', error);
      }
    );

  }

  loadListOrder(): void {
    this.orderService.ListOrders(
      this.currentPage,
      this.pageSize,
      this.search,
      this.dateFrom,
      this.dateTo,
      this.selectedStatus,
      this.selectedFilter,
      this.selectedType,
    ).subscribe(
      (response: ListAllOrder) => {
        if (response && response.items) {
          this.orders = [response];
          this.totalCount = response.totalCount;
          this.updateTotalPagesArray(response.totalPages);
          console.log('Fetched orders:', this.orders);
        } else {
          console.error('Invalid response:', response);
        }
      },
      (error) => {
        console.error('Error fetching orders:', error);
      }
    );
  }

  // loadListOrderDetails(orderId: number) {
  //   console.log(this.DiscountedTotalAmount());

  //   console.log('Loading details for Order ID:', orderId);
  //   this.orderDetailService.getOrderDetail(orderId).subscribe(
  //     (orderDetail: ListOrderDetailByOrder) => {
  //       this.orderDetail = orderDetail;
  //       this.tables = orderDetail.tables; // Assigning tables to a separate variable

  //       if (this.tables.length > 0) {
  //         this.tableId = this.tables[0].tableId; // Extracting tableId from the first table
  //       }

  //       // Iterate through orderDetails to access dishesServed and quantity
  //       let totalDishesServed = 0;
  //       let totalQuantity = 0;

  //       orderDetail.orderDetails.forEach((detail) => {
  //         totalDishesServed += detail.dishesServed; // No need for parseInt
  //         totalQuantity += detail.quantity; // No need for parseInt
  //       });
  //       this.dishesServed = totalDishesServed;
  //       this.totalQuantity = totalQuantity;

  //       console.log('Fetched order detail:', this.orderDetail);
  //       this.accountGuest = orderDetail.accountId;
  //       console.log(this.accountGuest);
  //       this.depositOrder = this.orderDetail.deposits;
  //     },
  //     (error) => {
  //       console.error('Error fetching order detail:', error);
  //     }
  //   );
  // }

  timeIn: string = '';
  tableLabels: string = '';
  reservationTime: string = '';  
  guestNumber: number = 0; 
  loadListOrderDetails(orderId: number) {
    console.log(this.DiscountedTotalAmount());

    console.log('Loading details for Order ID:', orderId);
    this.orderDetailService.getOrderDetail(orderId).subscribe(
      (orderDetail: any) => {  // Using 'any' typecasting here
        this.orderDetail = orderDetail;
        this.tables = orderDetail.tables;

        if (this.tables.length > 0) {
          this.tableId = this.tables[0].tableId;
        }

        let totalDishesServed = 0;
        let totalQuantity = 0;

        orderDetail.orderDetails.forEach((detail: any) => {
          totalDishesServed += detail.dishesServed;
          totalQuantity += detail.quantity;
        });
        this.dishesServed = totalDishesServed;
        this.totalQuantity = totalQuantity;

        this.accountGuest = orderDetail.accountId;
        this.depositOrder = this.orderDetail?.deposits;

        // Directly accessing reservation
        this.timeIn = orderDetail.reservation?.timeIn;  // Using optional chaining for safety
        this.reservationTime = orderDetail.reservation?.reservationTime;
        this.guestNumber = orderDetail.reservation?.guestNumber;
        console.log('Reservation timeIn:', this.timeIn);
        if (orderDetail.reservation?.tablesOfReservation?.length > 0) {
          this.tableLabels = orderDetail.reservation.tablesOfReservation
            .map((table: any) => table.lable)
            .join(', ');
          console.log('Table Labels:', this.tableLabels);
        }
      },
      (error) => {
        console.error('Error fetching order detail:', error);
      }
    );
  }


  updateOrder(orderId: number) {
    this.router.navigate(['/updateOrder', orderId]);
  }
  updateTotalPagesArray(totalPages: number): void {
    this.totalPagesArray = Array(totalPages).fill(0).map((x, i) => i + 1);
  }
  DiscountedTotalAmount(): number {
    if (this.orderDetail?.discountPercent && this.orderDetail.discountPercent > 0) {
      const discountAmount = (this.orderDetail.totalAmount * this.orderDetail.discountPercent) / 100;

      return this.orderDetail.totalAmount - discountAmount - this.orderDetail?.deposits;
    }
    return (this.orderDetail?.totalAmount ?? 0) - (this.orderDetail?.deposits ?? 0);
  }


  updateOrderStatus(orderId: number, status: number): void {
    this.orderService.UpdateOrderStatus(orderId, status).subscribe(
      (response) => {
        console.log('Order status updated successfully:', response);
        this.loadListOrder();
      },
      (error) => {
        console.error('Error updating order status:', error);
      }
    );
  }



  onStatusChange(event: Event, orderId: number): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedStatus = parseInt(selectElement.value, 10);
    const listOrder = this.orders.find(list => list.items.some(o => o.orderId === orderId));

    if (listOrder) {
      const order = listOrder.items.find(o => o.orderId === orderId);

      if (order) {
        order.status = selectedStatus;
        this.updateOrderStatus(orderId, selectedStatus);
      } else {
        console.error(`Order with orderId ${orderId} not found`);
      }
    } else {
      console.error(`ListAllOrder containing orderId ${orderId} not found`);
    }
  }

  getStatusText(status: number): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj ? statusObj.text : 'Không xác định';
  }

  getStatusColor(status: number): string {
    switch (status) {
      case 1:
        return 'orange';        // Đang chờ
      case 2:
        return 'blue';          // Đã chấp nhận
      case 3:
        return 'purple';       // Đang phục vụ
      case 4:
        return 'teal';         // Hoàn thành
      case 5:
        return 'red';          // Hủy
      case 6:
        return 'brown';        // Đang chuẩn bị
      case 7:
        return 'green';        // Đang giao hàng
      default:
        return 'black';        // Default color
    }
  }



  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadListOrder();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadListOrder();
  }

  navigateToCreateOrder() {
    this.router.navigate(['cuorder']);
  }

  createNewOrder() {
    this.router.navigate(['/cuorder']);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Add leading zero if month is < 10
    const day = ('0' + date.getDate()).slice(-2); // Add leading zero if day is < 10
    return `${year}-${month}-${day}`;
  }



  CreateInvoiceOnline(orderId: number | undefined): void {
    if (orderId != null) { // Check if orderId is neither null nor undefined
      const paymentMethod = parseInt(this.paymentMethod, 10);

      console.log('Payment Method:', paymentMethod);
      console.log('Customer Paid:', this.customerPaid);
      console.log('Discounted Total Amount:', this.DiscountedTotalAmount());

      let amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
      const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - this.DiscountedTotalAmount() : 0;

      console.log('Amount Received:', amountReceived);
      console.log('Return Amount:', returnAmount);

      // Determine paymentStatus based on paymentMethod
      let paymentStatus;
      if (paymentMethod === 0 || paymentMethod === 1) {
        paymentStatus = 1;
      } else if (paymentMethod === 2) {
        paymentStatus = 0;
        amountReceived = 0;
      }

      const updateData = {
        status: 6,
        paymentTime: new Date().toISOString(),
        paymentAmount: this.DiscountedTotalAmount(),
        taxcode: "HIEU",
        accountId: this.accountId,
        amountReceived: amountReceived,
        returnAmount: returnAmount,
        paymentMethods: paymentMethod,
        paymentStatus: paymentStatus,  // Set paymentStatus based on condition
        description: "strizzzg"
      };

      console.log('Update Data:', updateData);

      this.invoiceService.updateStatusAndCreateInvoice(orderId, updateData).subscribe(
        (response) => {
          console.log('Order status updated and invoice created:', response);
          this.loadInvoice(orderId);
        },
        (error: HttpErrorResponse) => {
          console.error('Error updating order status and creating invoice:', error);
        }
      );
    } else {
      console.warn('Order ID is not valid or is undefined.');
    }
  }


  CreateInvoiceTakeAway(orderId: number | undefined): void {
    if (orderId != null) { // Check if orderId is neither null nor undefined
      const paymentMethod = parseInt(this.paymentMethod, 10);

      console.log('Payment Method:', paymentMethod);
      console.log('Customer Paid:', this.customerPaid);
      console.log('Discounted Total Amount:', this.DiscountedTotalAmount());

      const amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
      const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - this.DiscountedTotalAmount() : 0;

      console.log('Amount Received:', amountReceived);
      console.log('Return Amount:', returnAmount);

      const updateData = {
        status: 6,
        paymentTime: new Date().toISOString(),
        paymentAmount: this.DiscountedTotalAmount(),
        taxcode: "HIEU",
        accountId: this.accountId,
        amountReceived: amountReceived,
        returnAmount: returnAmount,
        paymentMethods: paymentMethod,
        paymentStatus: 1,
        description: "strizzzg"
      };

      console.log('Update Data:', updateData);

      this.invoiceService.updateStatusAndCreateInvoice(orderId, updateData).subscribe(
        (response) => {
          console.log('Order status updated and invoice created:', response);
          this.loadInvoice(orderId);
        },
        (error: HttpErrorResponse) => {
          console.error('Error updating order status and creating invoice:', error);
        }
      );
    } else {
      console.warn('Order ID is not valid or is undefined.');
    }
  }
  loadInvoice(orderId: number): void {
    this.invoiceService.getInvoiceByOrderId(orderId).subscribe(
      data => {
        this.invoice = data;
      },
      error => {
        console.error('Error fetching invoice:', error);
      }
    );
  }
  reloadPage() {
    window.location.reload(); // Reloads the current page
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
  printInvoiceOrder(invoiceId: number, paymentAmount: number, returnAmount: number) {
    // Cập nhật hóa đơn
    this.updateOInvoice(invoiceId, paymentAmount, returnAmount);

    // Dữ liệu cần hiển thị
    const customerName = this.invoice.consigneeName || 'Khách lẻ';
    const phone = this.invoice.guestPhone || 'N/A';
    const address = this.invoice.address || 'N/A';

    // Log thông tin hóa đơn
    console.log({
      customerName,
      phone,
      address
    });

    // Tiến hành in
    const modalBody = document.querySelector('.modal-body2');

    // Kiểm tra nếu modalBody không null
    if (modalBody) {
      // Lưu nội dung của modalBody (sau khi xóa input)
      const modalContent = modalBody.innerHTML;

      // Xóa các thẻ div chứa input trong modal-body2
      const inputDivs = modalBody.querySelectorAll('div.mb-3'); // Tìm tất cả các div có class mb-3
      inputDivs.forEach(div => {
        const input = div.querySelector('input'); // Kiểm tra có input trong div không
        if (input) {
          div.remove(); // Xóa thẻ div chứa input
        }
      });

      // Cập nhật lại nội dung của modalContent sau khi xóa input
      const updatedModalContent = modalBody.innerHTML; // Lấy nội dung đã cập nhật

      // Mở cửa sổ in và chèn nội dung
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>In hóa đơn</title>');
        printWindow.document.write('</head><body>');

        // Thêm header
        printWindow.document.write(`
              <div class="header">
                <h1>Eating House</h1>
                <p>Địa chỉ: Khu công nghệ cao Hòa Lạc</p>
                <p>Hotline: 0393578176 - 0987654321</p>
                <p>Email: eatinghouse@gmail.com</p>
                <hr>
              </div>
            `);

        // Thêm nội dung chính của hóa đơn với thông tin khách hàng
        printWindow.document.write(`
              <div class="invoice-details">
                <p><strong>Tên khách hàng:</strong> ${customerName}</p>
                <p><strong>Số điện thoại:</strong> ${phone}</p>
                <p><strong>Địa chỉ:</strong> ${address}</p>
              </div>
              <hr>
              ${updatedModalContent} <!-- Chèn nội dung đã được chỉnh sửa -->
            `);

        // Thêm footer
        printWindow.document.write(`
              <hr>
              <div class="footer">
                Cảm ơn quý khách và hẹn gặp lại!
              </div>
            `);

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();

        // In tài liệu
        printWindow.print();
        printWindow.close();
      }
    } else {
      console.error('Không tìm thấy modal-body2.');
    }
  }





  printInvoice() {
    const printContents = document.querySelector('.modal-body2')?.innerHTML;
    const originalContents = document.body.innerHTML;

    if (printContents) {
      // Tạo một tài liệu in tạm thời
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow?.document.write('<html><head><title>In hóa đơn</title>');
      printWindow?.document.write('</head><body>');

      // Thêm header
      printWindow?.document.write(`
        <div class="header">
          <h1>Eating House</h1>
          <p>Địa chỉ: Khu công nghệ cao Hòa Lạc</p>
          <p>Hotline: 0393578176 - 0987654321</p>
          <p>Email: eatinghouse@gmail.com</p>
          <hr>
        </div>
      `);

      // Thêm nội dung chính của hóa đơn
      printWindow?.document.write(printContents);

      // Thêm footer
      printWindow?.document.write(`
        <hr>
        <div class="footer">
          Cảm ơn quý khách và hẹn gặp lại!
        </div>
      `);

      printWindow?.document.write('</body></html>');
      printWindow?.document.close();
      printWindow?.focus();

      // In tài liệu
      printWindow?.print();
      printWindow?.close();
    } else {
      console.error('Không thể tìm thấy nội dung hóa đơn để in.');
    }
  }


  // UpdateStatus(orderId: number | undefined, status: number | undefined) {
  //   if (orderId !== undefined && status !== undefined) {
  //     this.orderService.updateOrderStatus(orderId, status).subscribe(
  //       response => {
  //         window.location.reload();
  //         console.log('Invoice status updated successfully:', response);
  //         // Handle the plain text response, e.g., show a success message
  //       },
  //       error => {
  //         console.error('Error updating invoice status:', error);
  //         // Handle the error response
  //       }
  //     );
  //   } else {
  //     console.error('Order ID or status is undefined');
  //   }
  // }

  async CancelOrderReason(orderId: number | undefined) {
    if (orderId !== undefined) {
      const cancelationReason = this.cancelationReason;

      if (cancelationReason) {
        const cancelationData = {
          cancelationReason: cancelationReason
        };

        try {
          const response = await this.orderService.CancelOrder(orderId, cancelationData).toPromise();
          this.createNotification(orderId, 2);
          this.updateCancelResion(orderId);
          console.log('Invoice status updated successfully:', response);

          // Gọi sendOrderEmail để lấy địa chỉ email của khách hàng
          const emailResponse = await this.orderService.sendOrderEmail(orderId).toPromise();
          const customerEmail = emailResponse.email;
          const consigneeName = emailResponse.consigneeName;
          const supportPhone = emailResponse.phone// Thay thế bằng số điện thoại hỗ trợ thực tế
          const supportEmail = emailResponse.settingEmail; // Thay thế bằng địa chỉ email hỗ trợ thực tế
          const companyName = emailResponse.eateryName; // Tên công ty
          console.log(consigneeName);
          console.log(customerEmail); 

          // Gửi email thông báo (chạy không đồng bộ, không chờ đợi)
          this.orderService.sendEmail(
            customerEmail,
            'Thông Báo Hủy Đơn Hàng Từ Eating House',
            `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
              <p>Kính gửi <strong>${consigneeName}</strong>,</p>
              <p>Chúng tôi rất tiếc phải thông báo rằng đơn hàng của bạn đã bị hủy với lý do hủy: <strong>${cancelationReason}</strong>.</p>
              <p>Quý khách có thể xem chi tiết đơn hàng của mình tại đường dẫn sau: <a href="http://localhost:4200/orderDetail/${orderId}" style="color: blue; text-decoration: underline;">Xem chi tiết đơn hàng tại đây</a>.</p>
              <p>Nếu quý khách có bất kỳ thắc mắc hoặc yêu cầu nào, xin vui lòng liên hệ với chúng tôi qua số điện thoại <strong>${supportPhone}</strong> hoặc email <strong>${supportEmail}</strong>.</p>
              <p>Chúng tôi hy vọng có cơ hội phục vụ quý khách trong tương lai.</p>
              <p>Trân trọng,<br>${companyName}<br>${supportPhone}</p>
            </div>`
          ).subscribe(
            emailSentResponse => {
              console.log('Email thông báo hủy đơn hàng đã được gửi thành công:', emailSentResponse);
            },
            emailError => {
              console.error('Lỗi khi gửi email thông báo hủy đơn hàng:', emailError);
            }
          );

          // Không cần chờ gửi email, reload ngay lập tức
          window.location.reload();
        } catch (error) {
          console.error('Lỗi khi xử lý hủy đơn hàng:', error);
        }
      } else {
        console.error('Lý do hủy đơn hàng là bắt buộc');
      }
    } else {
      console.error('Order ID không xác định');
    }
  }



  updateCancelResion(orderId: number) {
    const request = {
      cancelationReason: this.cancelationReason,
      cancelBy: 'Nhân viên quán ăn'
    };
    this.paymentService.updateResionCancle(orderId, request).subscribe(
      (response) => {
        console.log(response);
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  }

  getDiscountOrderAmount(): number {
    if (this.orderDetail?.totalAmount && this.orderDetail?.discountPercent) {
      return (this.orderDetail.totalAmount * this.orderDetail.discountPercent) / 100;
    }
    return 0;
  }
  getDiscountInvoiceAmount(): number {
    if (this.invoice?.totalAmount && this.invoice?.discountPercent) {
      return (this.invoice.totalAmount * this.invoice.discountPercent) / 100;
    }
    return 0;
  }
  //Online thanh toan khi nhan hang
  updateAmountReceiving(orderId: number | undefined) {
    const paymentMethod = parseInt(this.paymentMethod, 10);
    // Create the data object with the required properties
    const amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
    const data = {
      status: 4,
      amountReceived: amountReceived,
      description: "Hieu Update"
    };

    if (orderId !== undefined) {
      this.orderService.updateAmountReceiving(orderId, data).subscribe(
        response => {
          window.location.reload();
          console.log('Amount received and status updated successfully:', response);
          // Handle the response, e.g., show a success message
        },
        error => {
          console.error('Error updating amount received and status:', error);
          // Handle the error response
        }
      );
    } else {
      console.error('Order ID is undefined');
    }
  }
  //Offline thanh toan truoc
  PrePayment(orderId: number | undefined) {
    const paymentMethod = parseInt(this.paymentMethod, 10);

    console.log('Payment Method:', paymentMethod);
    console.log('Customer Paid:', this.customerPaid);
    console.log('Discounted Total Amount:', this.DiscountedTotalAmount());

    let amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
    const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - this.DiscountedTotalAmount() : 0;

    console.log('Amount Received:', amountReceived);
    console.log('Return Amount:', returnAmount);
    if (orderId !== undefined) {
      const data = {
        deposits: this.DiscountedTotalAmount(),
        paymentTime: new Date().toISOString(), // Automatically sets the current date and time
        paymentAmount: this.DiscountedTotalAmount(),
        taxcode: "string",
        paymentStatus: 2,
        accountId: this.accountId,
        amountReceived: amountReceived,
        returnAmount: returnAmount,
        paymentMethods: paymentMethod,
        description: "Hieu Update",
      };

      this.invoiceService.updateDepositAndCreateInvoice(orderId, data).subscribe(
        response => {
          console.log('Order and invoice updated successfully:', response);
          this.loadInvoice(orderId);
        },
        error => {
          console.error('Error updating order and invoice:', error);
        }
      );
    } else {
      console.error('Invoice ID is undefined');
    }
  }
  getAmountDue(): number {
    if (!this.orderDetail) {
      return 0; // Or handle it appropriately
    }
    const discountedTotal = this.DiscountedTotalAmount();
    const deposits = this.orderDetail.deposits || 0;
    return discountedTotal - deposits;
  }
  getFinalAmountDue(): number {
    const totalAmount = this.DiscountedTotalAmount();
    const deposit = this.orderDetail?.deposits || 0;
    return totalAmount - deposit;
  }
  isCustomerPaidValid: boolean = true;
  validateCustomerPaid() {
    const amountDue = this.DiscountedTotalAmount(); // Get the amount due after considering deposits and discounts
    const customerPaidValue = this.customerPaid ?? 0; // Default to 0 if customerPaid is null

    if (customerPaidValue < amountDue) {
      console.error('Tiền khách trả không được nhỏ hơn tổng tiền đơn hàng.');
      this.isCustomerPaidValid = false; // Disable input if validation fails

      // Optionally reset the value if invalid
      if (this.customerPaid !== null) {
        this.customerPaid = null; // or you can set it to the minimum value
      }
    } else {
      this.isCustomerPaidValid = true; // Enable input if validation passes
    }
  }

  updateStatusReservation(id: number) {
    const data = {
      orderId: id,
      status: 4
    }
    this.invoiceService.updateOStatusReser(data).subscribe(
      response => {
        console.log(response);
      },
      error => {
        console.error('Error updating order and invoice:', error);
      }
    );
  }

  //Offline hoan thanh goi them mon

  SuscessfullOrderOffline(orderId: number | undefined, invoiceId?: number) {

    const paymentMethod = parseInt(this.paymentMethod, 10);

    console.log('Payment Method:', paymentMethod);
    console.log('Customer Paid:', this.customerPaid);
    console.log('Discounted Total Amount:', this.DiscountedTotalAmount());

    if (orderId !== undefined) {
      if (invoiceId === undefined || invoiceId === 0 || invoiceId === null) {
        // Create a new invoice
        let amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
        const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - this.DiscountedTotalAmount() : 0;

        const createData = {
          orderId: orderId,
          paymentTime: new Date().toISOString(),
          paymentAmount: this.DiscountedTotalAmount(),
          taxcode: "XYZDEW",
          paymentStatus: 1,
          customerName: "New Customer",
          amountReceived: amountReceived,
          returnAmount: returnAmount,
          paymentMethods: paymentMethod,
          accountId: this.accountId,
          description: "Invoice Created"
        };

        this.invoiceService.createInvoiceOffline(orderId, createData).subscribe(
          response => {
            console.log('Invoice created successfully:', response);
            this.loadInvoice(orderId);
            this.updateStatusReservation(orderId);
            // Additional handling on success
          },
          error => {
            console.error('Error creating invoice:', error);
            // Handle the error response
          }
        );
      } else {
        // Update an existing invoice
        const remainingAmountDue = this.getAmountDue();
        console.log('Remaining Amount Due:', remainingAmountDue);

        let amountReceived = paymentMethod === 0 ? (this.customerPaid ?? 0) : this.DiscountedTotalAmount();
        console.log('Amount Received:', amountReceived);

        const returnAmount = paymentMethod === 0 ? (this.customerPaid ?? 0) - remainingAmountDue : 0;
        console.log('Return Amount:', returnAmount);

        const updateData = {
          status: 4,
          paymentTime: new Date().toISOString(),
          paymentAmount: this.DiscountedTotalAmount(),
          taxcode: "XYZDEW",
          paymentStatus: 1,
          amountReceived: amountReceived,
          returnAmount: returnAmount,
          paymentMethods: paymentMethod,
          description: "Invoice Updated",
          tableStatus: 0,
        };

        this.invoiceService.updateOrderAndInvoice(orderId, updateData).subscribe(
          response => {
            console.log('Invoice updated successfully:', response);
            this.loadInvoice(orderId);
            // Additional handling on success
          },
          error => {
            console.error('Error updating invoice:', error);
            // Handle the error response
          }
        );
      }
    } else {
      console.error('Order ID is undefined');
    }
  }
  async acceptOrder(orderId: number | undefined): Promise<void> {
    if (orderId) {
      this.loadListOrderDetails(orderId);

      // Định nghĩa common data object
      const commonData = {
        paymentAmount: 0,
        taxcode: "string",
        accountId: this.accountId,
        amountReceived: 0,
        returnAmount: 0,
        description: "string"
      };

      // Xác định phương thức thanh toán dựa trên depositOrder
      const paymentData = {
        ...commonData,
        paymentMethods: this.depositOrder > 0 ? 1 : 2
      };

      try {
        // Chấp nhận đơn hàng
        const response = await this.orderService.AcceptOrderWaiting(orderId, paymentData).toPromise();
        console.log('Order accepted successfully:', response);
        this.createNotification(orderId, 1);
        this.createNotification(orderId, 3);

        // Gọi sendOrderEmail để lấy địa chỉ email của khách hàng
        const emailResponse = await this.orderService.sendOrderEmail(orderId).toPromise();
        const customerEmail = emailResponse.email;
        const consigneeName = emailResponse.consigneeName;
        const supportPhone = emailResponse.phone// Thay thế bằng số điện thoại hỗ trợ thực tế
        const supportEmail = emailResponse.settingEmail; // Thay thế bằng địa chỉ email hỗ trợ thực tế
        const companyName = emailResponse.eateryName; // Tên công ty
        console.log(consigneeName);
        console.log(customerEmail); // Điều chỉnh dựa trên cấu trúc phản hồi

        this.orderService.sendEmail(
          customerEmail,
          'Thông Báo Xác Nhận Đơn Hàng Thành Công Từ Eating House',
          `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <p>Kính gửi <strong>${consigneeName}</strong>,</p>
            <p>Chúng tôi xin thông báo rằng đơn hàng của bạn đã được chấp nhận và đang được xử lý.</p>
            <p>Quý khách có thể xem chi tiết đơn hàng của mình tại đường dẫn sau: <a href="http://localhost:4200/orderDetail/${orderId}" style="color: blue; text-decoration: underline;">Xem chi tiết đơn hàng tại đây</a>.</p>
            <p>Chúng tôi sẽ tiếp tục cập nhật tình trạng đơn hàng của bạn và thông báo khi hàng được giao.</p>
            <p>Nếu quý khách có bất kỳ thắc mắc hoặc yêu cầu nào, xin vui lòng liên hệ với chúng tôi qua số điện thoại <strong>${supportPhone}</strong> hoặc email <strong>${supportEmail}</strong>.</p>
            <p>Chân thành cảm ơn quý khách đã tin tưởng và ủng hộ.</p>
            <p>Trân trọng,<br>${companyName}<br>${supportPhone}</p>
          </div>`
        ).subscribe(
          emailSentResponse => {
            console.log('Email sent successfully:', emailSentResponse);
          },
          error => {
            console.error('Error sending email:', error);
          }
        );

        // Không cần chờ đợi việc gửi email, reload trang ngay lập tức
        window.location.reload();
      } catch (error) {
        console.error('Error accepting order:', error);
        // Xử lý lỗi khi chấp nhận đơn hàng
      }
    }
  }


  createNotification(orderId: number, check: number) {
    let description;
    let body;
    if (check === 1) {
      description = "Chúng tôi xin chân thành cảm ơn Quý Khách đã đặt hàng tại Eating House. Chúng tôi rất vui mừng thông báo rằng đơn đặt hàng của Quý Khách đã được chấp nhận và đang được xử lý.Chúng tôi sẽ cố gắng giao hàng đúng thời gian và đảm bảo rằng Quý Khách sẽ hài lòng với những món ăn mà chúng tôi đã chuẩn bị. Nếu có bất kỳ câu hỏi nào hoặc cần thay đổi đơn hàng, xin vui lòng liên hệ với chúng tôi qua số điện thoại 0123456789 hoặc email eattinghouse@gmail.com. Cảm ơn Quý Khách đã chọn Eating House. Chúng tôi rất mong được phục vụ Quý Khách!"
      body = {
        description: description,
        accountId: this.accountGuest,
        orderId: orderId,
        type: 1
      }
    } else if (check === 2) {
      description = `Kính gửi Quý Khách. Chúng tôi rất tiếc phải thông báo rằng đơn đặt hàng của Quý Khách tại Eating House với mã đơn hàng ${orderId} đã bị hủy. Lý do hủy đơn hàng: ${this.cancelationReason}. Chúng tôi thành thật xin lỗi về sự bất tiện này và mong rằng Quý Khách sẽ thông cảm. Chúng tôi luôn cố gắng cải thiện dịch vụ của mình để mang đến cho Quý Khách những trải nghiệm tốt nhất. Nếu Quý Khách cần thêm thông tin hoặc muốn đặt lại đơn hàng, vui lòng liên hệ với chúng tôi qua số điện thoại 0123456789 hoặc email eattinghouse@gmail.com. Cảm ơn Quý Khách đã hiểu và đồng hành cùng Eating House. `;
      body = {
        description: description,
        accountId: this.accountGuest,
        orderId: orderId,
        type: 1
      }
    } else if (check === 3) {
      description = `Có đơn hàng mới. Vui lòng xem danh sách các món ăn để làm! `;
      body = {
        description: description,
        orderId: orderId,
        type: 4
      }
    }

    this.notificationService.createNotification(body).subscribe(
      response => {
        console.log(response);
        // this.callFunctionInB(this.accountGuest);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  // callFunctionInB(data:number) {
  //   this.dataService.triggerFunction(data);
  //   console.log(data);
  // }
  getAccountDetails(accountId: number): void {
    this.accountService.getAccountById(accountId).subscribe(
      response => {
        this.account = response;
        console.log('Account details:', this.account);
        console.log('Account role:', this.account.role);

      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  getTablesAsString(): string {
    if (this.orderDetail?.tables && this.orderDetail.tables.length > 0) {
      return this.orderDetail.tables.map(table => table.lable).join(', ');
    }
    return '';
  }
  
  onDateFromChange(): void {

    this.onSearch();
  }

  onDateToChange(): void {
    if (this.dateTo < this.dateFrom) {
      this.dateFrom = this.dateTo;
    }
    this.onSearch();
  }
  reloadInvoice(invoiceId: number, paymentAmount: number, returnAmount: number) {
    this.updateOInvoice(invoiceId, paymentAmount, returnAmount);
    window.location.reload(); // Reloads the current page
  }
  remoney: any;
  updateOInvoice(invoiceId: number, paymentAmount: number, returnAmount: number) {
    const data = {
      invoiceId: invoiceId,
      paymentAmount: paymentAmount,
      returnAmount: returnAmount
    }
    this.invoiceService.updateOInvoice(data).subscribe(
      data => {
        console.log(data);
      },
      error => {
        console.error('Error fetching invoice:', error);
      }
    );
  }
  settings: any;
  QRUrl: string = '';
  getInfo(): void {
    this.settingService.getInfo().subscribe(
      response => {
        this.settings = response;
        console.log(response);
        this.QRUrl = this.settings[0].qrcode;
        console.log('URL Logo', this.QRUrl);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  printInvoiceAll(isFinal: boolean): void {
    let invoiceContent: string = `
    <div class="header" style="text-align: center;">
      <h1>Eating House</h1>
      <p>Địa chỉ: Khu công nghệ cao Hòa Lạc</p>
      <p>Hotline: 0393578176 - 0987654321</p>
      <p>Email: eatinghouse@gmail.com</p>
      <hr>
    </div>
    <h2 style="text-align: center;">${isFinal ? 'Hóa đơn' : 'Hóa đơn tạm'}</h2>
      <p><strong>Mã đơn hàng:</strong> ${this.orderDetail?.orderId || 'Khách lẻ'}</p>
      <p><strong>Tên khách hàng:</strong> ${this.orderDetail?.consigneeName || 'Khách lẻ'}</p>
      <p><strong>Số điện thoại:</strong> ${this.orderDetail?.guestPhone || '------------------'}</p>
      ${this.orderDetail?.type === 2 ? `<p><strong>Địa chỉ nhận hàng:</strong> ${this.orderDetail.guestAddress || 'N/A'}</p>` : ''}
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid black;">Món ăn</th>
            <th style="border: 1px solid black;">Số lượng</th>
            <th style="border: 1px solid black;">Giá</th>
            <th style="border: 1px solid black;">Tổng cộng</th>
          </tr>
        </thead>
        <tbody>
        ${this.orderDetail?.orderDetails.map(item => `
          <tr>
            <td style="border: 1px solid black;">${item.itemName || item.nameCombo}</td>
            <td style="border: 1px solid black;">${item.quantity}</td>
            <td style="border: 1px solid black;">${this.formatCurrency(item.discountedPrice || item.price)}</td>
            <td style="border: 1px solid black;">${this.formatCurrency(item.unitPrice)}</td>
          </tr>
        `).join('')}

        </tbody>
      </table>
       <p><strong>Tạm tính:</strong> ${this.formatCurrency(this.orderDetail?.totalAmount)}</p>
${this.orderDetail?.discountId !== undefined ? `
  <p><strong>Giảm giá:</strong> ${this.formatCurrency(this.getDiscountOrderAmount() || 0)}</p>
  <p><strong>Tổng cộng:</strong> ${this.formatCurrency(this.orderDetail?.totalAmount - (this.getDiscountOrderAmount() || 0))}</p>
` : ''}

    <div class="footer" style="text-align: center; margin-top: 20px;">
      <hr>
      <p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
      <p>Hẹn gặp lại quý khách!</p>
    </div>
    `;

    // Open new window
    let printWindow = window.open('', '', 'height=500,width=800');
    printWindow?.document.write('<html><head><title>In hóa đơn</title></head><body>');
    printWindow?.document.write(invoiceContent);
    printWindow?.document.write('</body></html>');
    printWindow?.document.close();
    printWindow?.print();
}


  formatCurrency(amount: number | undefined): string {
    if (amount === undefined) return '0đ';
    return `${amount.toLocaleString('vi-VN')}đ`;
  }

  printTemporaryInvoice(): void {
    if (this.orderDetail && this.account?.role === 'Cashier') {
      this.printInvoiceAll(false);  // Hóa đơn tạm
    }
  }

  printFinalInvoice(): void {
    if (this.orderDetail?.paymentStatus === 1 && this.account?.role === 'Cashier') {
      this.printInvoiceAll(true);  // Hóa đơn chính thức
    }
  }
  onCustomerPaidInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    const sanitizedInput = input.replace(/[^\d]/g, ''); // Chỉ cho phép số

    // Kiểm tra chiều dài của sanitizedInput
    if (sanitizedInput.length > 12) {
      // Cắt sanitizedInput về tối đa 12 ký tự
      const truncatedInput = sanitizedInput.slice(0, 12);
      // Cập nhật giá trị của input để ngăn chặn việc nhập thêm
      (event.target as HTMLInputElement).value = truncatedInput;
      // Cập nhật customerPaid
      this.customerPaid = parseFloat(truncatedInput);
      console.log("Vượt quá giới hạn 12 chữ số.");
      return; // Kết thúc hàm
    }

    // Cập nhật customerPaid nếu chiều dài hợp lệ
    this.customerPaid = sanitizedInput ? parseFloat(sanitizedInput) : null;
  }



  // Format the number when the input loses focus
  formatCurrency1(): string {
    if (this.customerPaid !== null) {
      // Chuyển đổi số thành chuỗi và định dạng
      const formattedValue = this.customerPaid.toLocaleString('vi-VN') + 'đ';
      return formattedValue; // Trả về giá trị đã định dạng
    }
    return ''; // Trả về chuỗi rỗng nếu customerPaid là null
  }

}
