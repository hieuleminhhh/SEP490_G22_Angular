import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiscountService } from '../../../service/discount.service';

@Component({
  selector: 'app-manage-discount',
  standalone: true,
  templateUrl: './ManageDiscount.component.html',
  styleUrls: ['./ManageDiscount.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ManageDiscountComponent implements OnInit {
  dateFrom: string = '';
  dateTo: string = '';
  dateNow: string = '';

  data: any[] = [];
  filteredData: any[] = [];
  dish: any[] = [];

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
      }
    ]
  };

  selectedIndex: number | undefined;

  constructor(private discountService: DiscountService) { }

  ngOnInit(): void {
    this.getListDiscount();
    this.dateNow = new Date().toISOString().split('T')[0]; // Thiết lập giá trị ban đầu cho dateNow
  }

  getListDiscount(): void {
    this.discountService.getListDiscount().subscribe(
      response => {
        this.data = response;
        this.filterList();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  filterList(): void {
    const status = (document.querySelector('input[name="status"]:checked') as HTMLInputElement)?.value || 'all';
    const search = (document.getElementById('search') as HTMLInputElement)?.value.toLowerCase() || '';

    this.filteredData = this.data.filter(program => {
      const matchesStatus = (status === 'all') ||
        (status === 'active' && program.discountStatus === true) ||
        (status === 'inactive' && program.discountStatus === false);
      const matchesSearch = program.discountName.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }

  getListDish(): void {
    this.discountService.getListDish().subscribe(
      response => {
        this.dish = response;
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  addCondition(): void {
    this.promotion.conditions.push({ totalAmount: '', percent: '' });
  }

  openPopup(): void {
    const addModal = document.getElementById('addDiscountModal');
    if (addModal) {
      addModal.classList.add('show');
      addModal.style.display = 'block';
      addModal.removeAttribute('aria-hidden');
      addModal.setAttribute('aria-modal', 'true');
      addModal.setAttribute('role', 'dialog');
    }
  }

  closePopup(): void {
    const addModal = document.getElementById('addDiscountModal');
    if (addModal) {
      addModal.classList.remove('show');
      addModal.style.display = 'none';
      addModal.setAttribute('aria-hidden', 'true');
      addModal.removeAttribute('aria-modal');
      addModal.removeAttribute('role');
    }
  }

  savePromotion(): void {
    console.log('Saving promotion:', this.promotion);
    this.closePopup();
  }

  onDateFromChange(): void {
    if (this.dateTo < this.dateFrom) {
      this.dateTo = this.dateFrom;
    }
  }

  onDateToChange(): void {
    // Custom logic if needed
  }

  formatCurrency(event: any, index: number): void {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '');

    if (!isNaN(Number(value))) {
      const formattedValue = new Intl.NumberFormat('en-US').format(Number(value));
      this.promotion.conditions[index].totalAmount = formattedValue;
      event.target.value = formattedValue;
    }
  }

  clearPercent(index: number): void {
    this.promotion.conditions[index].percent = '';
  }

  openDishModal(index: number): void {
    this.selectedIndex = index;
    this.getListDish();
    const dishModal = document.getElementById('dishModal');
    if (dishModal) {
      dishModal.classList.add('show');
      dishModal.style.display = 'block';
      dishModal.removeAttribute('aria-hidden');
      dishModal.setAttribute('aria-modal', 'true');
      dishModal.setAttribute('role', 'dialog');
    }
  }

  closeDishModal(): void {
    const dishModal = document.getElementById('dishModal');
    if (dishModal) {
      dishModal.classList.remove('show');
      dishModal.style.display = 'none';
      dishModal.setAttribute('aria-hidden', 'true');
      dishModal.removeAttribute('aria-modal');
      dishModal.removeAttribute('role');
    }
  }

  toggleAllDishes(event: any): void {
    const checked = event.target.checked;
    this.dish.forEach(dish => {
      dish.selected = checked;
    });
  }

  selectDishes(): void {
    const selectedDishes = this.dish.filter(dish => dish.selected).map(dish => dish.itemName);
    if (this.selectedIndex !== undefined) {
      // Implement logic to add selected dishes to the promotion conditions
    }
    this.closeDishModal();
  }
}
