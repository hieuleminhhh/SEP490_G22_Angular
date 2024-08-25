import { Component, OnInit } from '@angular/core';
import { HeaderOrderStaffComponent } from '../ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component';
import { SidebarOrderComponent } from "../SidebarOrder/SidebarOrder.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../../service/invoice.service';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';

@Component({
  selector: 'app-manage-invoice',
  templateUrl: './manage-invoice.component.html',
  styleUrls: ['./manage-invoice.component.css'],
  standalone: true,
  imports: [HeaderOrderStaffComponent, SidebarOrderComponent, FormsModule, CommonModule,CurrencyFormatPipe]
})
export class ManageInvoiceComponent implements OnInit {
  selectedTab: string = 'overview';
  data: any;
  orderCancel:any;
  orderShip:any;
  constructor(private invoiceService: InvoiceService) { }

  ngOnInit() {
    this.selectTab('overview');
    this.getOrdersCancel();
    this.getOrdersShip();
    this.getOrdersStatic();
  }
  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  getOrdersStatic(): void {
    this.invoiceService.getStatistics().subscribe(
      response => {
        this.data = response;
      },
      error => {
        console.error('Error:', error);

      }
    );
  }
  getOrdersCancel(): void {
    this.invoiceService.getCancelOrder().subscribe(
      response => {
        this.orderCancel = response;
      },
      error => {
        console.error('Error:', error);

      }
    );
  }
  getOrdersShip(): void {
    this.invoiceService.getOrderShip().subscribe(
      response => {
        this.orderShip = response;
      },
      error => {
        console.error('Error:', error);

      }
    );
  }
}
