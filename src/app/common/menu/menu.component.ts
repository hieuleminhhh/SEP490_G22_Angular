import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { Dish } from '../../../models/dish.model';
import { AsyncPipe, CommonModule } from '@angular/common';
import { CartService } from '../../../service/cart.service';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../service/category.service';
import { Combo } from '../../../models/combo.model';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-menu',
  standalone: true,
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  imports:[HttpClientModule, AsyncPipe, CommonModule]
})
export class MenuComponent{
  http = inject(HttpClient);
  successMessages: string[] = [];

  dishs$ = this.getDish();
  combo$ = this.getCombo();
  category$ = this.getCategory();
  dishService: any;
  selectedItem: any;
  sortOptions = ['Theo bảng chữ cái từ A-Z', 'Theo bảng chữ cái từ Z-A', 'Giá từ cao tới thấp', 'Giá từ thấp tới cao'];
  selectedCategory: string = '';
  selectedSortOption: string = '';
  selectedFilter: 'Category' | 'Combo' = 'Category';

  ngOnInit(): void {
    this.loadDishes();
  }

  constructor(private cartService: CartService, private categoryService: CategoryService, private cdr: ChangeDetectorRef) {
    this.dishs$ = this.getDish();
    this.category$ = this.getCategory();
    this.combo$ = this.getCombo();
  }

  private getDish(categoryName?: string, sortOption?: string): Observable<Dish[]> {
    let apiUrl = 'https://localhost:7188/api/Dish';

    // Xây dựng URL API dựa trên category và sortOption
    if (categoryName) {
      apiUrl += `/sorted-dishes?categoryName=${categoryName}`;
      if (sortOption) {
        switch (sortOption) {
          case 'Theo bảng chữ cái từ A-Z':
          apiUrl += '&sortField=0&sortOrder=0';
          break;
        case 'Theo bảng chữ cái từ Z-A':
          apiUrl += '&sortField=0&sortOrder=1';
          break;
        case 'Giá từ cao tới thấp':
          apiUrl += '&sortField=1&sortOrder=1';
          break;
        case 'Giá từ thấp tới cao':
          apiUrl += '&sortField=1&sortOrder=0';
          break;
          default:
            break;
        }
      }
    } else if (sortOption) {
      // Nếu không có category nhưng có sortOption, chỉ áp dụng sắp xếp
      switch (sortOption) {
        case 'Theo bảng chữ cái từ A-Z':
          apiUrl += '/sorted-dishes?sortField=0&sortOrder=0';
          break;
        case 'Theo bảng chữ cái từ Z-A':
          apiUrl += '/sorted-dishes?sortField=0&sortOrder=1';
          break;
        case 'Giá từ cao tới thấp':
          apiUrl += '/sorted-dishes?sortField=1&sortOrder=1';
          break;
        case 'Giá từ thấp tới cao':
          apiUrl += '/sorted-dishes?sortField=1&sortOrder=0';
          break;
        default:
          break;
      }
    }
    console.log(apiUrl);
    return this.http.get<Dish[]>(apiUrl).pipe(
      // Lọc danh sách món ăn dựa trên giá trị của isActive
      map(dishes => dishes.filter(dish => dish.isActive))
    );
  }

  onCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory = target.value === '*' ? '' : target.value;
    this.selectedFilter = 'Category';
    this.loadDishes();
  }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedSortOption = target.value;
    this.loadDishes();
  }

  onFilterChange(filter: 'Category' | 'Combo') {
    this.selectedFilter = filter;
    this.loadDishes();
  }

  private loadDishes() {
    if (this.selectedFilter === 'Category') {
      this.dishs$ = this.getDish(this.selectedCategory, this.selectedSortOption);
    } else if (this.selectedFilter === 'Combo') {
      this.combo$ = this.getCombo(this.selectedSortOption);
    }
  }

  private getCombo(sortOption?: string): Observable<Combo[]> {
    let apiUrl = 'https://localhost:7188/api/Combo';

    if (sortOption) {
      apiUrl += '/sorted-combos?';
      switch (sortOption) {
        case 'Theo bảng chữ cái từ A-Z':
          apiUrl += 'sortField=0&sortOrder=0';
          break;
        case 'Theo bảng chữ cái từ Z-A':
          apiUrl += 'sortField=0&sortOrder=1';
          break;
        case 'Giá từ cao tới thấp':
          apiUrl += 'sortField=1&sortOrder=1';
          break;
        case 'Giá từ thấp tới cao':
          apiUrl += 'sortField=1&sortOrder=0';
          break;
        default:
          break;
      }
    }
    console.log(apiUrl);
    return this.http.get<Combo[]>(apiUrl);
  }


  private getCategory():Observable<Category[]>{
    return this.http.get<Category[]>('https://localhost:7188/api/Category');
  }

  addToCart(item: any, itemType: string) {
    const successMessage = 'Thêm sản phẩm vào giỏ hàng thành công!';

    if (itemType === 'dish') {
      this.cartService.addToCart(item, 'Dish');
    } else if (itemType === 'combo') {
      this.cartService.addToCart(item, 'Combo');
    }

    this.successMessages.push(successMessage);
    this.cdr.detectChanges();

    setTimeout(() => {
      this.closeModal(this.successMessages.length - 1);
    }, 3000);
  }


  closeModal(index: number) {
    this.successMessages = [];
  }

  showDetails(item: any, type: string) {
    console.log(item);
    this.selectedItem = item;
  }

  closePopup() {
    this.selectedItem = null;
  }

}


