import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-customerPaidFormat',
  templateUrl: './customerPaidFormat.component.html',
  styleUrls: ['./customerPaidFormat.component.css']
})
export class CustomerPaidFormatComponent implements OnInit {

  constructor(private decimalPipe: DecimalPipe) { }

  ngOnInit() {
  }
  customerPaid: number | null = null;
  selectedDiscount: any; // Assuming you have this already
  totalAmount: number = 0;
  totalAmountAfterDiscount: number = 0;

  formatCustomerPaid(event: any) {
    let input = event.target.value;

    // Remove any non-digit characters except for the period (.)
    input = input.replace(/[^0-9]/g, '');

    // Add thousand separators using a regular expression
    const formattedValue = input.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Only update if the formatted value is not null
    if (formattedValue !== null) {
      this.customerPaid = formattedValue;
    }
  }
}
