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
  weeks: { start: string, end: string }[] = [];
  years: number[] = [];
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
    this.populateWeeks();
    this.populateYears();
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
  populateWeeks() {
    const selectElement = document.getElementById('week') as HTMLSelectElement;
    const currentDate = new Date();
    const currentWeekNumber = this.getWeekNumber(currentDate);
  
    for (let i = 1; i <= 52; i++) {
      const startOfWeek = new Date(currentDate.getFullYear(), 0, (i - 1) * 7 + 1);
      const endOfWeek = new Date(currentDate.getFullYear(), 0, (i - 1) * 7 + 7);
  
      const option = document.createElement('option');
      option.value = i.toString();
      const startDay = this.formatTwoDigits(startOfWeek.getDate());
      const startMonth = this.formatTwoDigits(startOfWeek.getMonth() + 1);
      const endDay = this.formatTwoDigits(endOfWeek.getDate());
      const endMonth = this.formatTwoDigits(endOfWeek.getMonth() + 1);
  
      option.text = `${startDay}/${startMonth} To ${endDay}/${endMonth}`;
      selectElement.appendChild(option);
  
      if (i === currentWeekNumber) {
        option.selected = true;
      }
    }
  }
  
  private getWeekNumber(date: Date): number {
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((date.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
    return weekNumber;
  }
  
  private formatTwoDigits(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
  populateYears() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
  }
  createNewOrder() {
    this.router.navigate(['/cuorder']); 
  }
}
