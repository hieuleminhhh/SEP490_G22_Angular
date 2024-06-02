import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { Dish } from '../../../models/dish.model';
import { AsyncPipe, CommonModule } from '@angular/common';
import { CartService } from '../../../service/cart.service';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../service/category.service';

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
  category$ = this.getCategory();
  dishes: Dish[] = [];
  dishService: any;

  constructor(private cartService: CartService, private categoryService: CategoryService) {
    this.dishs$ = this.getDish();
    this.category$ = this.getCategory();
  }

  private getDish(): Observable<Dish[]>{
    return this.http.get<Dish[]>('https://localhost:7188/api/Dish');
  }

  private getCategory():Observable<Category[]>{
    return this.http.get<Category[]>('https://localhost:7188/api/Category');
  }

  addToCart(dish: any) {
    this.cartService.addToCart(dish);
    this.successMessages.push('Added to cart successfully!');
    setTimeout(() => {
      // Gọi hàm để đóng thông báo sau 3 giây
      this.closeModal(this.successMessages.length - 1);
    }, 3000);
  }

  closeModal(index: number) {
    // Đóng thông báo thành công khi người dùng nhấp vào nút đóng
    this.successMessages = [];
  }


  onCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const categoryName = target.value === '*' ? null : target.value;
    if (categoryName) {
      this.dishs$ = this.categoryService.getDishesByCategory(categoryName).pipe(
        catchError(() => of([]))
      );
    } else {
      this.dishs$ = this.getDish();
    }
  }
}


