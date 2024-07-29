import { Component, OnInit } from '@angular/core';

import { CommonModule, Time } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiscountService } from '../../../service/discount.service';

@Component({
  selector: 'app-ManageDiscount',
  standalone: true,
  templateUrl: './ManageDiscount.component.html',
  styleUrls: ['./ManageDiscount.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ManageDiscountComponent implements OnInit {

  constructor(private discountService: DiscountService) { }

  ngOnInit(): void {
    this.getListDiscount();
  }

  dateFrom: string = '';
  dateTo: string = '';
  dateNow: string = '';

  data: any[] = [];
  filteredData: any[] = [];

  promotion = {
    name: '',
    status: 'active',
    note: '',
    type: 'order',
    discountType: 'discount-order',
    autoApply: false,
    conditions: [
      {
        totalAmount: '',
        percent: ''
      } // Điều kiện mặc định
    ]
  };

  getListDiscount(){
    this.discountService.getListDiscount().subscribe(
      response => {
        this.data = response;
        this.filterList();
        console.log(this.data);

      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  filterList() {
    const status = (document.querySelector('input[name="status"]:checked') as HTMLInputElement).value;
    const search = (document.getElementById('search') as HTMLInputElement).value.toLowerCase();

    console.log('Status:', status);
    console.log('Search:', search);

    this.filteredData = this.data.filter(program => {
      const matchesStatus = (status === 'all') ||
        (status === 'active' && program.discountStatus === true) ||
        (status === 'inactive' && program.discountStatus === false);
      const matchesSearch = program.discountName.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });

    console.log('Filtered Data:', this.filteredData);
  }
  addCondition() {
    this.promotion.conditions.push({ totalAmount: '', percent: '' });
  }

  openPopup(): void {
    const addModal = document.getElementById('addDiscountModal');
    if (addModal) {
      addModal.classList.add('show');
      addModal.style.display = 'block';
    }
  }


  closePopup(): void {
    const addModal = document.getElementById('addDiscountModal');
    if (addModal) {
      addModal.classList.remove('show');
      addModal.style.display = 'none';
    }
  }


  savePromotion(): void {
    // Implement the save logic here
    console.log('Saving promotion:', this.promotion);
    this.closePopup();
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
  filterOrdersByDate(): void {
    // if (this.dateFrom && this.dateTo) {
    //   const fromDate = new Date(`${this.dateFrom}T00:00:00Z`);
    //   const toDate = new Date(`${this.dateTo}T23:59:59Z`);
    //   this.filteredOrders = this.order.filter((order: { recevingOrder: string | Date }) => {
    //     const orderDate = new Date(order.recevingOrder);
    //     return orderDate >= fromDate && orderDate <= toDate;
    //   });
    //   console.log(this.filteredOrders);
    // } else {
    //   this.filteredOrders = this.order;
    // }
  }
  formatCurrency(event: any, index: number) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, ''); // Xóa tất cả ký tự không phải là số

    if (isNaN(Number(value))) {
      return;
    }

    const formattedValue = new Intl.NumberFormat('en-US').format(Number(value));
    this.promotion.conditions[index].totalAmount = formattedValue;
    event.target.value = formattedValue;
  }
  clearPercent(index: number) {
    this.promotion.conditions[index].percent = '';
  }

}
