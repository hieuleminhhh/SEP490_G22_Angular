import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { CookingService } from '../../../service/cooking.service';

@Component({
  selector: 'app-order-ship',
  standalone: true,
  templateUrl: './order-ship.component.html',
  styleUrls: ['./order-ship.component.css'],
  imports: [CommonModule, FormsModule, CurrencyFormatPipe]
})
export class OrderShipComponent implements OnInit {

  constructor(private cookingService:CookingService) { }
  deliveryOrders: any[] = [];
  selectedItem: any;
  ngOnInit() {
    this.getListShip(1);
  }
  showDetails(order: any) {
    console.log(order);
    this.selectedItem = order;
  }

  closePopup() {
    this.selectedItem = null;
  }

  getListShip(accountId:number){
    this.cookingService.getListShip(7,accountId).subscribe(
      response => {
        this.deliveryOrders = response;
        console.log(this.deliveryOrders);

      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  completeOrder(order:any){
    const request = {
      status : 4
    };
    this.cookingService.updateOrderStatus(order.orderId,request).subscribe(
      response => {
        window.location.reload();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  cancelOrder(order:any){
    const request = {
      status : 5
    };
    this.cookingService.updateOrderStatus(order.orderId,request).subscribe(
      response => {
        window.location.reload();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
}
