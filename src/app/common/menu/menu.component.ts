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
  selectedSortOption: string = '';
  selectedCategory: string = '';

  constructor(private cartService: CartService, private categoryService: CategoryService, private cdr: ChangeDetectorRef) {
    this.dishs$ = this.getDish();
    this.category$ = this.getCategory();
    this.combo$ = this.getCombo();
  }

  private getDish(categoryName?: string, sortOption?: string): Observable<Dish[]> {
    let apiUrl = 'https://localhost:7188/api/Dish';

    // Xây dựng URL API dựa trên category và sortOption
    if (categoryName) {
      apiUrl += `?category=${categoryName}`;
      if (sortOption) {
        switch (sortOption) {
          case 'From A to Z':
            apiUrl += '&sort=asc';
            break;
          case 'From Z to A':
            apiUrl += '&sort=desc';
            break;
          case 'Descending Price':
            apiUrl += '&sort=priceDesc';
            break;
          case 'Ascending Price':
            apiUrl += '&sort=priceAsc';
            break;
          default:
            break;
        }
      }
    } else if (sortOption) {
      // Nếu không có category nhưng có sortOption, chỉ áp dụng sắp xếp
      switch (sortOption) {
        case 'From A to Z':
          apiUrl += '/sorted?sortField=0&sortOrder=0';
          break;
        case 'From Z to A':
          apiUrl += '/sorted?sortField=0&sortOrder=1';
          break;
        case 'Descending Price':
          apiUrl += '/sorted?sortField=1&sortOrder=1';
          break;
        case 'Ascending Price':
          apiUrl += '/sorted?sortField=1&sortOrder=0';
          break;
        default:
          break;
      }
    }

    return this.http.get<Dish[]>(apiUrl);
  }



  private getCombo(): Observable<Combo[]>{
    return this.http.get<Combo[]>('https://localhost:7188/api/Combo');
  }

  private getCategory():Observable<Category[]>{
    return this.http.get<Category[]>('https://localhost:7188/api/Category');
  }

  // onSortChange(event: Event) {
  //   const target = event.target as HTMLSelectElement;
  //   const sortOption = target.value;

  //   // Gọi lại getDish với tùy chọn sắp xếp mới
  //   this.dishs$ = this.getDish(sortOption);
  // }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const sortOption = target.value;

    // Lưu sortOption để sử dụng khi gọi lại getDish
    this.selectedSortOption = sortOption;

    // Gọi lại getDish với sortOption mới và category hiện tại
    this.dishs$ = this.getDish(this.selectedCategory, sortOption);
  }

  addToCart(item: any, itemType: string) {
    const successMessage = 'Add item to cart successfully!';

    if (itemType === 'dish') {
      this.cartService.addToCart(item, 'Dish');
    } else if (itemType === 'combo') {
      this.cartService.addToCart(item, 'Combo');
    }

    this.successMessages.push(successMessage);  // Add success message
    this.cdr.detectChanges();  // Kích hoạt phát hiện thay đổi

    setTimeout(() => {
      // Gọi hàm để đóng thông báo sau 3 giây
      this.closeModal(this.successMessages.length - 1);
    }, 3000);
  }


  closeModal(index: number) {
    // Đóng thông báo thành công khi người dùng nhấp vào nút đóng
    this.successMessages = [];
  }

  selectedFilter: 'Category' | 'Combo' = 'Category';
  onCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const categoryName = target.value === '*' ? null : target.value;
    if (categoryName) {
      this.selectedFilter = 'Category';
      this.dishs$ = this.categoryService.getDishesByCategory(categoryName).pipe(
        catchError(() => of([]))
      );
    } else {
      this.selectedFilter = 'Category';
      this.dishs$ = this.getDish();
    }
  }
  showDetails(item: any, type: string) {
    console.log(item);
    this.selectedItem = item;
  }

  closePopup() {
    this.selectedItem = null;
  }

}


