import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Dish } from '../../../models/dish.model';
import { AsyncPipe, CommonModule } from '@angular/common';
import { CartService } from '../../../service/cart.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  imports:[HttpClientModule, AsyncPipe, CommonModule]
})
export class MenuComponent{
  http = inject(HttpClient);

  dishs$ = this.getDish();

  private getDish(): Observable<Dish[]>{
    return this.http.get<Dish[]>('https://localhost:7188/api/Dish');
  }

  constructor(private cartService: CartService) { }
  addToCart(dish: any) {
    this.cartService.addToCart(dish);
  }

}


