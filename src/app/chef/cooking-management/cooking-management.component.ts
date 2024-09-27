import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CookingService } from '../../../service/cooking.service';
import { HeaderOrderStaffComponent } from "../../staff/ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";
import { NotificationService } from '../../../service/notification.service';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';


@Component({
  selector: 'app-cooking-management',
  standalone: true,
  templateUrl: './cooking-management.component.html',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderOrderStaffComponent],
  styleUrls: ['./cooking-management.component.css']
})
export class CookingManagementComponent implements OnInit {

  currentView: string = 'order-layout';
  dateFrom: string = '';
  dateTo: string = '';
  dateNow: string = '';
  order: any;
  filteredOrders: any[] = [];
  preOrder: any;
  forms: { [key: number]: FormGroup } = {};
  selectedItem: any;
  ingredient: any;
  private socket!: WebSocket;
  private reservationQueue: any[] = [];
  isSending: boolean = false;
  private intervalId: any;
  constructor(private cookingService: CookingService,private http: HttpClient, private notificationService: NotificationService, private fb: FormBuilder, private titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Nhà bếp | Eating House');
    const today = new Date();
    this.dateFrom = this.formatDate(today);
    this.dateTo = this.formatDate(today);
    this.dateNow = this.formatDate(today);
    this.getOrders('Current');
    this.socket = new WebSocket('wss://localhost:7188/ws');
    this.socket.onopen = () => {
      while (this.reservationQueue.length > 0) {
        this.socket.send(this.reservationQueue.shift());
      }
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
      try {
        this.getOrders('Current');
      } catch (error) {
        console.error('Error parsing reservation data:', error);
      }
    };
    this.socket.onclose = () => {
      console.log('WebSocket connection closed, attempting to reconnect...');
      setTimeout(() => {
        this.initializeWebSocket();
      }, 5000);
    };
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    this.intervalId = setInterval(() => {
      this.getOrders('Current');
    }, 10000);
  }
  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  initializeWebSocket() {
    console.log("Initializing WebSocket...");
    this.socket = new WebSocket('wss://localhost:7188/ws');

    this.socket.onopen = () => {
      console.log("WebSocket connection opened.");
      while (this.reservationQueue.length > 0) {
        this.socket.send(this.reservationQueue.shift());
      }
    };

    this.socket.onmessage = (event) => {
      console.log("WebSocket message received: ", event.data);
      try {
        this.getOrders('Current');
      } catch (error) {
        console.error('Error parsing reservation data:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed, attempting to reconnect...', event);
      setTimeout(() => {
        this.initializeWebSocket(); // Thử lại sau 5 giây
      }, 5000);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  setView(view: string) {
    this.currentView = view;
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

  getOrders(type: string): void {
    this.filteredOrders = [];
    this.preOrder = [];
    this.cookingService.getOrders(type).subscribe(
      response => {
        this.order = response.data || [];
        this.order.forEach((o: { orderDetailId: number; quantity: number; dishesServed: number }) => {
          o.dishesServed = o.dishesServed || 0;
          this.initializeForm(o.orderDetailId, o.quantity);
        });
        this.filterOrdersByDate();
        this.loadCompletedDishes();
        console.log(response.data);

      },
      error => {
        this.order = [];
        this.filteredOrders = [];
      }
    );
  }

  initializeForm(orderDetailId: number, orderQuantity: number): void {
    this.forms[orderDetailId] = this.fb.group({
      dishesServed: [0, [
        Validators.required,
        Validators.min(1),
        Validators.max(orderQuantity)
      ]]
    });
  }

  filterOrdersByDate(): void {
    if (this.dateFrom && this.dateTo) {
      const fromDate = new Date(`${this.dateFrom}T00:00:00`);
      const toDate = new Date(`${this.dateTo}T23:59:59`);
      this.filteredOrders = this.order.filter((order: {
        quantity: number; recevingOrder: string | Date
      }) => {
        const orderDate = new Date(order.recevingOrder);
        return orderDate >= fromDate && orderDate <= toDate && order.quantity > 0;
      });
      console.log(this.filteredOrders);
      this.preOrder = this.filteredOrders;
    } else {
      this.filteredOrders = this.order.filter((order: { quantity: number }) => order.quantity > 0);
      console.log(this.filteredOrders);
    }
  }

  completeDish(orderDetailId: number, itemNameOrComboName: string, type: number, orderId: number): void {
    const form = this.forms[orderDetailId];
    const dishesServed = form.value.dishesServed;

    if (type === 1 || type === 2) {
      this.updateDishesServed(orderDetailId, dishesServed, itemNameOrComboName, type, orderId);

    } else {
      this.updateLocal(orderDetailId, dishesServed, itemNameOrComboName);
      this.createNotification(1, orderDetailId, dishesServed, itemNameOrComboName);
    }
    this.updateOrderQuantity(orderDetailId, dishesServed);
    this.filterOrders();
    form.reset({ dishesServed: 0 });
  }


  private updateLocal(orderDetailId: number, dishesServed: number, itemNameOrComboName: string): void {
    let completedDishes = JSON.parse(localStorage.getItem('completedDishes') || '[]');
    completedDishes.push({ orderDetailId, dishesServed, itemNameOrComboName });
    localStorage.setItem('completedDishes', JSON.stringify(completedDishes));
  }

  private updateOrderQuantity(orderDetailId: number, dishesServed: number): void {
    const orderIndex = this.order.findIndex((o: { orderDetailId: number }) => o.orderDetailId === orderDetailId);

    if (orderIndex !== -1) {
      this.order[orderIndex].quantity -= dishesServed;
      if (this.order[orderIndex].quantity < 0) {
        this.order[orderIndex].quantity = 0;
      }
    }
  }

  private loadCompletedDishes(): void {
    let completedDishes = JSON.parse(localStorage.getItem('completedDishes') || '[]');
    completedDishes.forEach((dish: { orderDetailId: number; dishesServed: number }) => {
      this.updateOrderQuantity(dish.orderDetailId, dish.dishesServed);

    });
    this.filterOrders();
  }

  private filterOrders(): void {
    this.filteredOrders = this.order.filter((order: { quantity: number; }) => order.quantity > 0);
  }

  updateDishesServed(orderDetailId: number, dishesServed: number, itemNameOrComboName: string, type: number, orderId: number) {
    const request = {
      orderDetailId: orderDetailId,
      dishesServed: dishesServed
    };
    this.cookingService.updateDishesServed(request).subscribe(
      response => {
        this.cookingService.checkOrders(orderId).subscribe(
          response => {
            if (response === true) {
              this.createNotification(2, orderDetailId, dishesServed, itemNameOrComboName);
            }
          },
          error => {
            console.error('Error:', error);
          }
        );
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  convertOrderType(type: number): string {
    switch (type) {
      case 1:
        return 'Mang về';
      case 2:
        return 'Giao hàng';
      case 3:
        return 'Đặt bàn';
      case 4:
        return 'Tại chỗ';
      default:
        return 'Không xác định';
    }
  }
  addOneHour(dateString: string): string {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 1);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const updatedDateString = `${year}-${month}-${day}T${hours}:${minutes}`;

    return updatedDateString;
  }

  isRecevingOrderCloseToCurrentTime(recevingOrder: string): boolean {
    if (!recevingOrder) return false;

    const currentDate = new Date();
    const recevingOrderDate = new Date(recevingOrder);

    const timeDifference = Math.abs(currentDate.getTime() - recevingOrderDate.getTime());
    const oneHourInMilliseconds = 60 * 60 * 1000;

    return timeDifference <= oneHourInMilliseconds;
  }

  isRecevingOrderMoreThanOneHourLater(recevingOrder: string, orderTime: string): boolean {
    if (!recevingOrder || !orderTime) return false;

    const recevingOrderDate = new Date(recevingOrder);
    const orderTimeDate = new Date(orderTime);
    const oneHourInMilliseconds = 60 * 60 * 1000;

    return recevingOrderDate.getTime() >= (orderTimeDate.getTime() + oneHourInMilliseconds);
  }

  showDetails(name: string, quantity: number) {
    this.getIngredient(name, quantity);
  }

  closePopup() {
    this.ingredient = null;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getIngredient(name: string, quantity: number): void {
    this.cookingService.getIngredient(name, quantity).subscribe(
      response => {
        this.ingredient = response;
        console.log(this.ingredient);

      },
      error => {
        console.error('Error:', error);
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
  createNotification(check: number, orderDetailId: number, dishesServed: number, itemNameOrComboName: string) {
    let description;
    let data;
    if (check === 1) {
      data = {
        description: description,
        orderDetailId: orderDetailId,
        dishesServed: dishesServed,
        itemNameOrComboName: itemNameOrComboName,
      }
      description = `Có món ăn đã làm xong cho đơn tại quán ăn. Vui lòng kiểm tra và lên món`;
    }
    else if (check === 2) {
      data = {
        description: description
      }
      description = `Có đơn hàng đã xong . Vui lòng kiểm tra và trả đơn`;
    }
    const body = {
      description: description,
      type: 2
    }
    this.makeReservation(data);
    console.log(body);
    this.notificationService.createNotification(body).subscribe(
      response => {
        console.log(response);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
}

function interval(arg0: number) {
  throw new Error('Function not implemented.');
}

function switchMap(arg0: () => any): any {
  throw new Error('Function not implemented.');
}

