import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-tableManagement',
  standalone:true,
  templateUrl: './tableManagement.component.html',
  styleUrls: ['./tableManagement.component.css'],
  imports:[ CommonModule]
})
export class TableManagementComponent implements OnInit {

  currentView: string = 'table-layout';
  constructor() { }

  ngOnInit() {
  }

  setView(view: string) {
    this.currentView = view;
  }
}
