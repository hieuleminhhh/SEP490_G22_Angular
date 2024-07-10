import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CookingService } from '../../../service/cooking.service';

@Component({
  selector: 'app-cooking-management',
  standalone: true,
  templateUrl: './cooking-management.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./cooking-management.component.css']
})
export class CookingManagementComponent implements OnInit {

  currentView: string = 'order-layout';
  dateFrom: string = '';
  dateTo: string = '';
  order: any;

  constructor(private cookingService: CookingService) { }

  ngOnInit(): void {
    this.getOrders('1-4');
  }

  setView(view: string) {
    this.currentView = view;
  }

  getOrders(type: string): void {
    this.cookingService.getOrders(type).subscribe(
      response => {
        this.order = response.data;
        console.log(this.order);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  getTypeString(type: number): string {
    switch (type) {
      case 1:
        return 'tại chỗ';
      case 2:
        return 'online';
      case 3:
        return 'đặt bàn';
      case 4:
        return 'mang về';
      default:
        return '';
    }
  }
}
