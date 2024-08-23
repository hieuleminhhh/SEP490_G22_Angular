import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-SidebarAdmin',
  templateUrl: './SidebarAdmin.component.html',
  styleUrls: ['./SidebarAdmin.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule] 
})
export class SidebarAdminComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

}
