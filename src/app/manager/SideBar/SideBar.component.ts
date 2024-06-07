import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // Import RouterModule
import { Router } from '@angular/router';
import feather from 'feather-icons';

@Component({
  selector: 'app-SideBar',
  templateUrl: './SideBar.component.html',
  styleUrls: ['./SideBar.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule] 
})
export class SideBarComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }
  ngAfterViewInit() {
    feather.replace();
  }
}
