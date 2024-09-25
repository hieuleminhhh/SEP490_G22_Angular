import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../service/cart.service';
import { catchError, map, Observable, of } from 'rxjs';
import { Dish } from '../../../models/dish.model';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Category } from '../../../models/category.model';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, IonicModule, HttpClientModule, CurrencyFormatPipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  successMessages: string[] = [];
  dishs$: Observable<Dish[]> = this.getDish();
  category$: Observable<Category[]> = this.getCategory();

  selectedItem: any;
  selectedCategory: string | null = null;

  constructor(private cartService: CartService, private cdr: ChangeDetectorRef, private http: HttpClient, private titleService: Title) {}
  ngOnInit(): void {
    this.titleService.setTitle('Trang chủ | Eating House');
  }
  addToCart(item: any, itemType: string) {
    const successMessage = 'Đã thêm sản phẩm vào giỏ hàng!';

    if (!item || !itemType) {
      console.error('Invalid item or itemType');
      return;
    }

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

  private getDish(categoryName?: string): Observable<Dish[]> {
    let apiUrl = 'https://localhost:7188/api/Dish';

    if (categoryName) {
      apiUrl += `/sorted-dishes?categoryName=${categoryName}`;
    }

    return this.http.get<any>(apiUrl).pipe(
      map(response => {

        if (Array.isArray(response)) {
          return response.filter((dish: Dish) => dish.isActive);
        } else if (response && Array.isArray(response.data)) {
          return response.data.filter((dish: Dish) => dish.isActive);
        } else {
          console.error('API response.data is not an array');
          return [];
        }
      }),
      catchError(error => {
        console.error('Error fetching dishes:', error);
        return of([]);
      })
    );
  }

  private getCategory(): Observable<Category[]> {
    return this.http.get<Category[]>('https://localhost:7188/api/Category');
  }

  filterByCategory(categoryName: string | null) {
    this.selectedCategory = categoryName;
    this.dishs$ = this.getDish(categoryName ?? undefined); // Lọc món ăn theo danh mục hoặc lấy tất cả nếu categoryName là null
  }

  closeModal(index: number) {
    this.successMessages = [];
  }

  closePopup() {
    this.selectedItem = null;
  }

  showDetails(item: any, type: string) {
    console.log(item);
    this.selectedItem = item;
  }
}
