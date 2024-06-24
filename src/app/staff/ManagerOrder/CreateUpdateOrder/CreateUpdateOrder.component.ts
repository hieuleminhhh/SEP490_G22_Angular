import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerDishService } from '../../../../service/managerdish.service';
import { ListAllDishes } from '../../../../models/dish.model';
import { ManagerComboService } from '../../../../service/managercombo.service';
import { ListAllCombo } from '../../../../models/combo.model';
@Component({
  selector: 'app-CreateUpdateOrder',
  templateUrl: './CreateUpdateOrder.component.html',
  styleUrls: ['./CreateUpdateOrder.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule]
})
export class CreateUpdateOrderComponent implements OnInit {

  constructor(private router: Router, private dishService: ManagerDishService, private comboService: ManagerComboService) { }
  dishes: ListAllDishes[] = [];
  combo: ListAllCombo[] = [];
  totalPagesArray: number[] = [];
  selectedItems: any[] = [];
  currentPage: number = 1;
  pageSize: number = 5;
  totalCount: number = 0;
  showingDishes: boolean = true;
  showingCombos: boolean = false;
  ngOnInit() {
    this.loadListDishes();
    this.loadListCombo();
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
  loadListCombo(search: string = ''): void {
    console.log('Loading combos with search term:', search);
    this.comboService.ListCombo(this.currentPage, this.pageSize, search).subscribe(
      (response) => {
        if (response && response.items) {
          this.combo = [response];
          this.totalCount = response.totalCount;
          console.log('Fetched combos:', this.combo);
        } else {
          console.error('Invalid response:', response);
        }
      },
      (error) => {
        console.error('Error fetching combos:', error);
      }
    );
  }
  showDishes() {
    this.showingDishes = true;
    this.showingCombos = false;
  }

  showCombos() {
    this.showingDishes = false;
    this.showingCombos = true;
  }
  addItem(item: any) {
    this.selectedItems.push(item);
  }
  removeItem(index: number) {
    this.selectedItems.splice(index, 1);
  }
}
