import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DiscountService } from '../../../service/discount.service';

@Component({
  selector: 'app-manage-discount',
  standalone: true,
  templateUrl: './ManageDiscount.component.html',
  styleUrls: ['./ManageDiscount.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ManageDiscountComponent implements OnInit {
  dateNow: string = '';

  data: any[] = [];
  filteredData: any[] = [];
  dish: any[] = [];
  formSubmitted = false;

  selectedDishes: { id: number, name: string }[][] = [];
  currentIndex: number = 0;

  promotion: any = {
    discountName: '',
    note: '',
    discountStatus: 'true',
    startTime: '',
    endTime: '',
    type: '1',
    conditions: [{
      totalAmount: null, percent: null, quantityLimit: null
    }]
  };

  conditions: any[] = [
    { quantityLimit: null, noLimit: false },
  ];

  promotionData: any;
  detailDiscount: any[] = [];
  isEditing: boolean = false;

  constructor(private discountService: DiscountService) { }

  ngOnInit(): void {
    this.getListDiscount();
    const today = new Date().toISOString().split('T')[0];
    this.dateNow = today;
    this.promotion.startTime = today;
    this.promotion.endTime = today;

    // Khởi tạo conditions đồng bộ với promotion.conditions
    this.conditions = this.promotion.conditions.map(() => ({
      quantityLimit: null,
      noLimit: false
    }));
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

    const filtered = this.data.filter(program => {
      const matchesStatus = (status === 'all') ||
        (status === 'active' && program.discountStatus === true) ||
        (status === 'inactive' && program.discountStatus === false);
      const matchesSearch = program.discountName.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });

    // Loại bỏ các mục trùng lặp
    const uniquePrograms = filtered.filter((program, index, self) =>
      index === self.findIndex((p) => (
        p.discountName === program.discountName &&
        p.startTime === program.startTime &&
        p.endTime === program.endTime &&
        p.type === program.type &&
        p.discountStatus === program.discountStatus
      ))
    );

    this.filteredData = uniquePrograms;
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
  onPromotionTypeChange(): void {
    if (this.promotion.type === '1') {
      this.promotion.type = '1';
      this.promotion.conditions = [{
        totalAmount: null, percent: null, quantityLimit: null
      }];
    } else if (this.promotion.type === '2') {
      this.promotion.type = '2';
      this.promotion.conditions = [{
        totalAmount: null, percent: null, quantityLimit: null
      }];
    }
    if (this.promotion.type === '2') {
      this.selectedDishes = this.selectedDishes.slice(0, this.promotion.conditions.length);
    } else {
      this.selectedDishes = [];
    }
  }

  addCondition(): void {
    console.log(this.promotion.type);

    if (this.promotion.type === '1') {
      this.promotion.conditions.push({ totalAmount: null, percent: null, quantityLimit: null });
      this.conditions.push({ quantityLimit: null, noLimit: false });
    } else if (this.promotion.type === '2') {
      const newIndex = this.promotion.conditions.length;
      this.promotion.conditions.push({ percent: null });
      this.selectedDishes[newIndex] = [];
      this.conditions.push({ quantityLimit: null, noLimit: false });
    }
  }

  clearCondition(index: number): void {
    if (this.promotion.conditions.length === 1) {
      if (this.promotion.type === '1') {
        this.promotion.conditions[index] = { totalAmount: null, percent: null, quantityLimit: null };
        this.conditions[index] = { quantityLimit: null, noLimit: false };
      } else if (this.promotion.type === '2') {
        this.selectedDishes[index] = [];
        this.promotion.conditions[index] = { percent: null };
        this.conditions[index] = { quantityLimit: null, noLimit: false };
      }
    } else {
      this.promotion.conditions.splice(index, 1);
      this.conditions.splice(index, 1);
      if (this.promotion.type === '2') {
        this.selectedDishes.splice(index, 1);
      }
    }
  }


  removeDish(index: number, dishId: number): void {
    const dishIndex = this.selectedDishes[index].findIndex(dish => dish.id === dishId);
    if (dishIndex !== -1) {
      this.selectedDishes[index].splice(dishIndex, 1);
    }
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

  savePromotion(promotionForm: any): void {
    this.formSubmitted = true;
    if (promotionForm.valid) {
      for (let i = 0; i < this.promotion.conditions.length; i++) {
        const condition = this.promotion.conditions[i];
        try {
          // Kiểm tra this.conditions[i] tồn tại
          if (!this.conditions[i]) {
            throw new Error(`Condition at index ${i} is not properly initialized.`);
          }
          const promotionData = {
            discountPercent: Number(condition.percent) || 0, // Chuyển đổi thành số
            discountStatus: this.promotion.discountStatus === 'true', // Chuyển đổi chuỗi thành boolean
            discountName: this.promotion.discountName || '', // Đảm bảo không phải null hoặc undefined
            type: Number(this.promotion.type), // Chuyển đổi thành số
            startTime: new Date(this.promotion.startTime).toISOString(), // Đảm bảo định dạng ISO
            endTime: new Date(this.promotion.endTime).toISOString(), // Đảm bảo định dạng ISO
            note: this.promotion.note || '', // Đảm bảo không phải null hoặc undefined
            totalMoney: Number(condition.totalAmount) || 0, // Chuyển đổi thành số
            quantityLimit: this.conditions[i].noLimit ? null : Number(this.conditions[i].quantityLimit) || 0 // Chuyển đổi thành số hoặc null nếu noLimit là true
          };

          this.sendPromotionData(promotionData, i);
        } catch (error) {
          console.error('Error at index:', i, error);
        }
      }
      // this.closePopup();
    }
  }

  sendPromotionData(promotionData: any, index: number): void {
    this.discountService.createDiscount(promotionData).subscribe(
      response => {
        console.log('Promotion saved successfully for condition index:', index, response);
        const discountId = response.discountId;
        if (discountId && this.promotion.type === '2') {
          this.updateDishDiscountId(discountId, index);
        }
      },
      error => {
        console.error('Error saving promotion for condition index:', index, error.message || error);
        alert('Có lỗi xảy ra khi lưu chương trình khuyến mại. Vui lòng kiểm tra lại.');
      }
    );
  }
  updateDishDiscountId(discountId: number, index: number): void {
    const selectedDishes = this.selectedDishes[index];
    const dishIds: number[] = selectedDishes.map(dish => dish.id); // Tạo mảng dishIds từ selectedDishes

    console.log(`Updating dishes with discountId ${discountId}`, dishIds);

    this.discountService.updateDishDiscountId(discountId, dishIds).subscribe(
      response => {
        console.log('Dishes updated successfully for discountId:', discountId);
      },
      error => {
        console.error('Error updating dishes for discountId:', discountId, error);
        console.error('Error details:', error.error); // Log error details
        alert('Có lỗi xảy ra khi cập nhật món ăn. Vui lòng kiểm tra lại.');
      }
    );
  }

  onDateFromChange(): void {
    if (this.promotion.endTime < this.promotion.startTime) {
      this.promotion.endTime = this.promotion.startTime;
    }
    if (this.detailDiscount[0].endTime < this.detailDiscount[0].startTime) {
      this.detailDiscount[0].endTime = this.detailDiscount[0].startTime;
    }
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
  openDetailDiscountModal(id: number): void {
    this.getDetailDiscounts(id);
  }

  closeDetailDiscountModal(): void {
    this.detailDiscount = []; // Xóa nội dung khi đóng modal
    const detailModal = document.getElementById('detailDiscountModal');
    if (detailModal) {
      detailModal.classList.remove('show');
      detailModal.style.display = 'none';
    }
  }
  convertDateToInputFormat(date: string): string {
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0];
  }
  getDetailDiscounts(id: number): void {
    this.discountService.getDetailDiscounts(id).subscribe(
      response => {
        if (response && response.length > 0) {
          // Chuyển đổi định dạng ngày cho tất cả các phần tử trong mảng
          response.forEach((discount: { startTime: string; endTime: string; }) => {
            discount.startTime = this.convertDateToInputFormat(discount.startTime);
            discount.endTime = this.convertDateToInputFormat(discount.endTime);
          });
        }
        this.detailDiscount = response || [];
        console.log(this.detailDiscount); // Kiểm tra dữ liệu sau khi chuyển đổi
        this.showModal();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  showModal(): void {
    const detailModal = document.getElementById('detailDiscountModal');
    if (detailModal) {
      detailModal.classList.add('show');
      detailModal.style.display = 'block';
    }
  }
  toggleAllDishes(event: any): void {
    const checked = event.target.checked;
    this.dish.forEach(dish => {
      dish.selected = checked;
    });
  }

  selectDishes() {
    const selectedDishDetails = this.dish
      .filter(dish => dish.selected)
      .map(dish => ({ id: dish.dishId, name: dish.itemName }));

    this.selectedDishes[this.currentIndex] = selectedDishDetails;
    console.log(this.selectedDishes);
    this.closeDishModal();
  }


  toggleLimit(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    this.conditions[index].noLimit = input.checked;

    if (this.conditions[index].noLimit) {
      this.conditions[index].quantityLimit = null; // Xóa giá trị của số lượng giới hạn
    }

    console.log('Checkbox changed for index:', index, 'New noLimit value:', this.conditions[index].noLimit);
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
  }

  saveChanges() {
    // Hàm lưu thay đổi của bạn...
    this.isEditing = false;
  }
}
