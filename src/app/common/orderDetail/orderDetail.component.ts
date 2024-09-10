import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { PurchaseOrderService } from '../../../service/purchaseOrder.service';
import { NgIf, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-orderDetail',standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf,FormsModule,CommonModule,CurrencyFormatPipe],
  templateUrl: './orderDetail.component.html',
  styleUrls: ['./orderDetail.component.css']
})
export class OrderDetailComponent implements OnInit {
  orderId: any;
  orderDetail: any;
  constructor(private route: ActivatedRoute, private purchaseOrderService: PurchaseOrderService,private location: Location) { }

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id');
    console.log(this.orderId);
    this.getOrderDetail();
  }

  getOrderDetail() {
    this.purchaseOrderService.getOrderDetail(this.orderId).subscribe(
      response => {
        this.orderDetail = response;
        console.log(response);
      },
      error => {
        console.error('Error fetching account details:', error);
      }
    );
  }
  goBack() {
    this.location.back(); // Quay lại trang trước đó
  }
}

