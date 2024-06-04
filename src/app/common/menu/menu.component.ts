import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { Dish } from '../../../models/dish.model';
import { AsyncPipe, CommonModule } from '@angular/common';
import { CartService } from '../../../service/cart.service';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../service/category.service';
import { Combo } from '../../../models/combo.model';

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

  constructor(private cartService: CartService, private categoryService: CategoryService) {
    this.dishs$ = this.getDish();
    this.category$ = this.getCategory();
    this.combo$ = this.getCombo();
  }

  private getDish(): Observable<Dish[]>{
    return this.http.get<Dish[]>('https://localhost:7188/api/Dish');
  }

  private getCombo(): Observable<Combo[]>{
    return this.http.get<Combo[]>('https://localhost:7188/api/Combo');
  }

  private getCategory():Observable<Category[]>{
    return this.http.get<Category[]>('https://localhost:7188/api/Category');
  }

  addToCart(item: any, itemType: string) {
    const successMessage = 'Added to cart successfully!';

  if (itemType === 'dish') {
    this.cartService.addToCart(item, 'Dish');
  } else if (itemType === 'combo') {
    this.cartService.addToCart(item, 'Combo');
  }
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
}


