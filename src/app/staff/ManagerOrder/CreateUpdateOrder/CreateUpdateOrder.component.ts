import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerDishService } from '../../../../service/managerdish.service';
import { ListAllDishes } from '../../../../models/dish.model';
@Component({
  selector: 'app-CreateUpdateOrder',
  templateUrl: './CreateUpdateOrder.component.html',
  styleUrls: ['./CreateUpdateOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule]
})
export class CreateUpdateOrderComponent implements OnInit {

  constructor(private router: Router, private dishService: ManagerDishService) { }
  dishes: ListAllDishes[] = [];
  totalPagesArray: number[] = [];
  currentPage: number = 1;
  pageSize: number = 5;
  totalCount: number = 0;
  ngOnInit() {
    this.loadListDishes();
  }
  loadListDishes(search: string = ''): void {
    console.log('Loading dishes with search term:', search); 
    this.dishService.ListDishes(this.currentPage, this.pageSize, search).subscribe(
      (response: ListAllDishes) => {
        if (response && response.items) {
          this.dishes = [response];
          this.totalCount = response.totalCount;
          console.log('Fetched dishes:', this.dishes);
        } else {
          console.error('Invalid response:', response);
        }
      },
      (error) => {
        console.error('Error fetching dishes:', error);
      }
    );
  }
}
