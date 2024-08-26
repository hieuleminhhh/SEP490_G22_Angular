import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { CookingService } from '../../../service/cooking.service';
import { HeaderOrderStaffComponent } from "../../staff/ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";
import { InvoiceService } from '../../../service/invoice.service';

@Component({
  selector: 'app-order-ship',
  standalone: true,
  templateUrl: './order-ship.component.html',
  styleUrls: ['./order-ship.component.css'],
  imports: [CommonModule, FormsModule, CurrencyFormatPipe, HeaderOrderStaffComponent]
})
export class OrderShipComponent implements OnInit {

  constructor(private cookingService: CookingService, private invoiceService: InvoiceService) { }
  deliveryOrders: any[] = [];
  selectedItem: any;
  accountId: any;
  ngOnInit() {
    const accountIdString = localStorage.getItem('accountId');
    this.accountId = accountIdString ? Number(accountIdString) : null;

    this.getListShip(this.accountId);
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
        if(order.deposits>0){
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
    this.cookingService.updateOrderStatus(order.orderId, request).subscribe(
      response => {
        window.location.reload();
      },
      error => {
        console.error('Error:', error);
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
  orderShipper:any;
  getOrderShip(data:any){
    console.log(data);

    this.orderShipper = data;
  }
}
