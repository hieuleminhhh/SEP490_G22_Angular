import { Component, OnInit } from '@angular/core';
import { ManagerOrderService } from '../../../service/managerorder.service';
import { ListAllOrder } from '../../../models/order.model';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerOrderDetailService } from '../../../service/managerorderDetail.service';
import { ListOrderDetailByOrder } from '../../../models/orderDetail.model';

@Component({
  selector: 'app-ManagerOrder',
  templateUrl: './ManagerOrder.component.html',
  styleUrls: ['./ManagerOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule]
})
export class ManagerOrderComponent implements OnInit {
  orders: ListAllOrder[] = [];
  search: string = '';  
  currentPage: number = 1;
  pageSize: number = 5;
  totalCount: number = 0;
  totalPagesArray: number[] = [];
  statuses = [
    { value: 0, text: 'Đang chờ' },
    { value: 1, text: 'Đã chấp nhận' },
    { value: 2, text: 'Hoàn thành' },
    { value: 3, text: 'Hủy' }
  ];
  orderDetail: ListOrderDetailByOrder | undefined;
  constructor(private orderService: ManagerOrderService, private orderDetailService : ManagerOrderDetailService, private router: Router) { }

  ngOnInit() {
    this.loadListOrder();
  }
  loadListOrder(search: string = ''): void {
    this.orderService.ListOrders(this.currentPage, this.pageSize, search).subscribe(
      (response: ListAllOrder) => {
        if (response && response.items) {
          this.orders = [response];
          this.totalCount = response.totalCount;
          this.updateTotalPagesArray(response.totalPages);
          console.log('Fetched order:', this.orders);
        } else {
          console.error('Invalid response:', response);
        }
      },
      (error) => {
        console.error('Error fetching dishes:', error);
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
      case 0:
        return 'orange';
      case 1:
        return 'blue';
      case 2:
        return 'green';
      case 3:
        return 'red';
      default:
        return 'black';
    }
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadListOrder(this.search);
  }
  onSearch(): void {
    this.currentPage = 1;
    console.log('Search term:', this.search);  
    this.loadListOrder(this.search);
  }
  navigateToCreateOrder() {
    this.router.navigate(['cuorder']);
  }
  
}
