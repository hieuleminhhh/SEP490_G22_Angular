import { ReservationService } from './../../../service/reservation.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, Inject, inject, Input } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { Dish } from '../../../models/dish.model';
import { AsyncPipe, CommonModule } from '@angular/common';
import { CartService } from '../../../service/cart.service';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../service/category.service';
import { Combo } from '../../../models/combo.model';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyFormatPipe } from '../material/currencyFormat/currencyFormat.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-menu',
  standalone: true,
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  imports: [HttpClientModule, AsyncPipe, CommonModule, FormsModule, CurrencyFormatPipe]
})
export class MenuComponent {
  @Input() modalTitle: string = ''; 
  http = inject(HttpClient);
  successMessages: string[] = [];

  dishs$!: Observable<Dish[]>;
  combo$!: Observable<Combo[]>;
  category$!: Observable<Category[]>;
  dishService: any;
  selectedItem: any;
  sortOptions = ['Theo bảng chữ cái từ A-Z', 'Theo bảng chữ cái từ Z-A', 'Giá từ cao tới thấp', 'Giá từ thấp tới cao'];
  selectedCategory: string = '';
  selectedSortOption: string = '';
  selectedFilter: 'Category' | 'Combo' = 'Category';
  @Input() isReser: boolean = false;

  currentPage = 1; // Trang hiện tại
  itemsPerPage = 9; // Số bản ghi trên mỗi trang
  totalItems = 0; // Tổng số bản ghi

  filteredDataSubject = new BehaviorSubject<any[]>([]);
  filteredData$ = this.filteredDataSubject.asObservable();

  allData: any[] = [];

  ngOnInit(): void {
    this.loadDishes();
    sessionStorage.removeItem('isReser');
    this.titleService.setTitle('Thực đơn | Eating House');

  }

  constructor(private cartService: CartService, private reservationService: ReservationService,
    private categoryService: CategoryService, private cdr: ChangeDetectorRef, private titleService: Title
  ) {
    this.dishs$ = this.getDish();
    this.category$ = this.getCategory();
    this.combo$ = this.getCombo();
    const isReserString = sessionStorage.getItem('isReser');
    this.isReser = isReserString !== null ? JSON.parse(isReserString) : false;
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
    return this.http.get<any>(apiUrl).pipe(
      map(response => {

        if (Array.isArray(response)) {
          return response.filter((dish: Dish) => dish.isActive);
        }
        else if (response && Array.isArray(response.data)) {
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

  onCategoryChange(event: Event) {
    const target = event.target as HTMLButtonElement;
    this.selectedCategory = target.innerText;
    this.selectedFilter = 'Category';
    console.log(this.selectedFilter);

    this.loadDishes();
  }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedSortOption = target.value;
    this.loadDishes();
  }

  onFilterChange(filter: 'Category' | 'Combo') {
    this.selectedFilter = filter;
    this.selectedCategory = filter;
    this.loadDishes();
  }

  private loadDishes() {
    if (this.selectedFilter === 'Category') {
      this.dishs$ = this.getDish(this.selectedCategory, this.selectedSortOption);
      this.dishs$.subscribe(
        (data: Dish[]) => {
          this.allData = data;
          this.filterList();
        },
        (error: any) => {
          console.error('Error fetching dishes:', error);
        }
      );
    } else if (this.selectedFilter === 'Combo') {
      this.combo$ = this.getCombo(this.selectedSortOption);
      this.combo$.subscribe(
        (data: Combo[]) => {
          this.allData = data;
          this.filterList();
        },
        (error: any) => {
          console.error('Error fetching combos:', error);
        }
      );
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
    return this.http.get<Combo[]>(apiUrl);
  }


  private getCategory(): Observable<Category[]> {
    return this.http.get<Category[]>('https://localhost:7188/api/Category');
  }

  addToCart(item: any, itemType: string) {
    if (!this.isReser) {
      const successMessage = 'Đã thêm sản phẩm vào giỏ hàng!';

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
    } else {
      const successMessage = 'Đã thêm sản phẩm vào đặt bàn!';

      if (itemType === 'dish') {
        this.reservationService.addToCart(item, 'Dish');
      } else if (itemType === 'combo') {
        this.reservationService.addToCart(item, 'Combo');
      }

      this.successMessages.push(successMessage);
      this.cdr.detectChanges();

      setTimeout(() => {
        this.closeModal(this.successMessages.length - 1);
      }, 3000);
    }

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

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;

      this.loadDishes();
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadDishes();
    }
  }

  paginateData(data: any[]): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    if (startIndex >= data.length || startIndex < 0) {
      console.warn('Start index out of bounds');
      this.filteredDataSubject.next([]);
      return;
    }
    const paginatedData = data.slice(startIndex, endIndex);
    this.filteredDataSubject.next(paginatedData);
  }


  goToDesiredPage(): void {
    if (this.currentPage >= 1 && this.currentPage <= this.totalPages) {
      this.loadDishes();
    } else {
      console.log('Invalid page number');
    }
  }
  filterList(): void {
    const search = (document.getElementById('search') as HTMLInputElement)?.value.toLowerCase() || '';

    const filtered = this.allData.filter(item =>
      (item.itemName || item.nameCombo || '').toLowerCase().includes(search)
    );
    this.totalItems = filtered.length;
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    if (this.currentPage > totalPages) {
      this.currentPage = totalPages > 0 ? totalPages : 1;
    }

    this.filteredDataSubject.next(filtered);
    console.log(this.filteredDataSubject);

    this.paginateData(filtered);
  }


}


