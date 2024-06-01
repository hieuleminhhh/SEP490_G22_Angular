import { HttpClient } from '@angular/common/http';
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core'; // Import ViewChild và ElementRef

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements AfterViewInit {
  constructor(private http: HttpClient) { } // Dependency injection through the constructor

  gets: any[] = [];
  @ViewChild('productGrid') productGridRef!: ElementRef;

  ngAfterViewInit() {
    setTimeout(() => {
      this.getAll();
    });
  }

  getAll() {
    this.fetchData();
  }

  fetchData() {
    this.http.get<any[]>('https://localhost:7188/api/Dish')
      .subscribe(
        (data: any[]) => {
          if (!this.productGridRef || !this.productGridRef.nativeElement) {
            console.error('Product grid element not found');
            return;
          }
          console.log(data);
          const productGrid = this.productGridRef.nativeElement;

          data.forEach(product => {
            const productElement = document.createElement('div');
            productElement.classList.add('grid-product');
            productElement.innerHTML = `
            <div class="grid-product square">
            <div class="img-name">
            <img src="${product.imageUrl}" alt="${product.itemName}" width="220" height="200">
            <h4>${product.itemName}</h4>
          </div>
          <p class="price" style="display: flex; justify-content: space-between; align-items: center;">
          <span>$${product.price}</span>
          <button class="add-to-cart js-add-to-cart btn" style="margin-left: 10px; border: 2px solid red;">Order Now</button>
        </p>
            `;

            productGrid.appendChild(productElement);
          });
        },
        error => {
          console.error('Error:', error);
        }
      );
  }
}
