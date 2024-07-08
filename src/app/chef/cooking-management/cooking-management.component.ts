import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  constructor() { }

  ngOnInit() {
  }
  setView(view: string) {
    this.currentView = view;
  }
}
