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

  selectedDishes: { [key: number]: string[] } = {};

  currentIndex: number = 0;

  promotion: any = {
    discountName: '',
    note: '',
    discountStatus: 'true',
    startTime: new Date().toISOString(),
    endTime: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    type: '0',
    conditions: [{
      totalAmount: 0,
      percent: 0
    }]
  };

  constructor(private discountService: DiscountService) { }

  ngOnInit(): void {
    this.getListDiscount();
    this.dateNow = new Date().toISOString().split('T')[0];

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
    }
  }

  closePopup(): void {
    const addModal = document.getElementById('addDiscountModal');
    if (addModal) {
      addModal.classList.remove('show');
      addModal.style.display = 'none';
    }
    window.location.reload();
  }

  savePromotion(): void {
    if (!this.promotion.conditions || this.promotion.conditions.length === 0) {
      console.error('No conditions available.');
      alert('Vui lòng thêm điều kiện khuyến mại.');
      return;
    }

    const promotionData = {
      discountPercent: Number(this.promotion.conditions[0].percent) || 0, // Chuyển đổi thành số
      discountStatus: this.promotion.discountStatus === 'true', // Chuyển đổi chuỗi thành boolean
      discountName: this.promotion.discountName || '', // Đảm bảo không phải null hoặc undefined
      type: Number(this.promotion.type), // Chuyển đổi thành số
      startTime: new Date(this.promotion.startTime).toISOString(), // Đảm bảo định dạng ISO
      endTime: new Date(this.promotion.endTime).toISOString(), // Đảm bảo định dạng ISO
      note: this.promotion.note || '', // Đảm bảo không phải null hoặc undefined
      totalMoney: Number(this.promotion.conditions[0].totalAmount) || 0 // Chuyển đổi thành số
    };

    console.log('Sending promotion data:', promotionData);

    this.discountService.createDiscount(promotionData).subscribe(
      response => {
        console.log('Promotion saved successfully', response);
      },
      error => {
        console.error('Error saving promotion:', error.message || error);
        alert('Có lỗi xảy ra khi lưu chương trình khuyến mại. Vui lòng kiểm tra lại.');
      }
    );
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
    this.currentIndex = index;
    if (this.selectedDishes[index]) {
      this.dish.forEach(dish => {
        dish.selected = this.selectedDishes[index].includes(dish.itemName);
      });
    } else {
      this.dish.forEach(dish => (dish.selected = false));
    }
    this.getListDish();
    const dishModal = document.getElementById('dishModal');
    if (dishModal) {
      dishModal.classList.add('show');
      dishModal.style.display = 'block';
    }
  }

  closeDishModal(): void {
    const dishModal = document.getElementById('dishModal');
    if (dishModal) {
      dishModal.classList.remove('show');
      dishModal.style.display = 'none';
    }
  }

  toggleAllDishes(event: any): void {
    const checked = event.target.checked;
    this.dish.forEach(dish => {
      dish.selected = checked;
    });
  }

  selectDishes() {
    const selectedDishNames = this.dish.filter(dish => dish.selected).map(dish => dish.itemName);
    this.selectedDishes[this.currentIndex] = selectedDishNames;
    this.closeDishModal();
  }
  removeDish(conditionIndex: number, dishName: string) {
    this.selectedDishes[conditionIndex] = this.selectedDishes[conditionIndex].filter(dish => dish !== dishName);
  }

  clearDish(index: number) {
    this.selectedDishes[index] = [];
  }
}
