import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-Header',
  templateUrl: './Header.component.html',
  styleUrls: ['./Header.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule] 
})
export class HeaderComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  

}
