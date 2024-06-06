import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../Header/Header.component';
import { SideBarComponent } from '../SideBar/SideBar.component';

@Component({
  selector: 'app-ManagerCombo',
  templateUrl: './ManagerCombo.component.html',
  styleUrls: ['./ManagerCombo.component.css'],
  standalone: true,
  imports: [SideBarComponent, RouterModule, CommonModule, FormsModule, HeaderComponent]
})
export class ManagerComboComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
