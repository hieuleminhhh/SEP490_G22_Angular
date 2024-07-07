import { Component, OnInit } from '@angular/core';
import { ManagerOrderService } from '../../../service/managerorder.service';
import { ListAllOrder } from '../../../models/order.model';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerOrderDetailService } from '../../../service/managerorderDetail.service';
import { ListOrderDetailByOrder } from '../../../models/orderDetail.model';
import { SidebarOrderComponent } from "../SidebarOrder/SidebarOrder.component";

@Component({
    selector: 'app-ManagerOrder',
    templateUrl: './ManagerOrder.component.html',
    styleUrls: ['./ManagerOrder.component.css'],
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent]
})
export class ManagerOrderComponent implements OnInit {
  orders: ListAllOrder[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  search: string = '';  
  currentPage: number = 1;
  pageSize: number = 5;
  totalCount: number = 0;
  totalPagesArray: number[] = [];
  weeks: { start: string, end: string }[] = [];
  years: number[] = [];
  statuses = [
    { value: 1, text: 'Đang chờ' },
    { value: 2, text: 'Đã chấp nhận' },
    { value: 3, text: 'Đang phục vụ' },
    { value: 4, text: 'Hoàn thành' },
    { value: 5, text: 'Hủy' }
  ];
  types = [
    { value: '1', text: 'Mang về' },
    { value: '2', text: 'Online' },
    { value: '3', text: 'Đặt bàn' },
    { value: '4', text: 'Tại chỗ' }
  ];
  filterByDate = [
    { value: 'Đặt hàng', text: 'Đặt hàng' },
    { value: 'Giao hàng', text: 'Giao hàng' },
  ];
  selectedStatus: number = 0;
  selectedFilter: string = 'Đặt hàng';
  selectedType: number = 0;
  orderDetail: ListOrderDetailByOrder | undefined;

  constructor(
    private orderService: ManagerOrderService, 
    private orderDetailService: ManagerOrderDetailService, 
    private router: Router
  ) {}

  ngOnInit() {
    this.setDefaultDates();
    this.loadListOrder();
  }

  setDefaultDates() {
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo = this.formatDate(today);
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
  

  loadListOrderDetails(orderId: number) {
    this.orderDetailService.getOrderDetail(orderId).subscribe(
      (orderDetail) => {
        this.orderDetail = orderDetail;
        console.log('Fetched order detail:', this.orderDetail);
      },
      (error) => {
        console.error('Error fetching order detail:', error);
      }
    );
  }

  updateTotalPagesArray(totalPages: number): void {
    this.totalPagesArray = Array(totalPages).fill(0).map((x, i) => i + 1);
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
        return 'orange';
      case 2:
        return 'blue';
      case 3:
        return 'purple';
      case 4:
        return 'teal';
      case 5:
        return 'red';
      default:
        return 'black';
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
}
