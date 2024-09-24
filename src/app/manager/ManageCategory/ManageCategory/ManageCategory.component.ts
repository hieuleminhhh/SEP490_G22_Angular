import { Component, OnInit } from '@angular/core';
import { Category } from '../../../../models/category.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderOrderStaffComponent } from '../../../staff/ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component';
import { SideBarComponent } from '../../SideBar/SideBar.component';
import { CategoryService } from '../../../../service/category.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-ManageCategory',
  templateUrl: './ManageCategory.component.html',
  styleUrls: ['./ManageCategory.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderOrderStaffComponent, SideBarComponent]
})
export class ManageCategoryComponent implements OnInit {
  categories: any;
  categoryName: string = '';
  successMessage: string = '';
  constructor(private categoryService: CategoryService, private titleService: Title) { }

  ngOnInit() {
    this.titleService.setTitle('Quản lý thể loại | Eating House');
    this.getAllCategories();
  }
  getAllCategories() {
    this.categoryService.getAllCategories().subscribe(
      (data: any) => {
        this.categories = data;
        console.log(this.categories);
      },
      error => {
        console.error('Error fetching categories', error);
      }
    );
  }
  addCategory() {
    this.categoryService.addCategory(this.categoryName).subscribe(
      response => {
        console.log('Category added:', response);
        this.successMessage = 'Danh mục đã được thêm thành công!';

        // Display the message for 2 seconds, then reload the page
        setTimeout(() => {
          this.successMessage = ''; // Clear the message
          window.location.reload(); // Reload the page
        }, 2000);
        
      },
      error => {
        console.error('Error adding category:', error);
        // Handle error (e.g., display an error message)
      }
    );
  }
  editCategory(categoryId: number) {
    // Logic to edit the selected category
  }

  deleteCategory(categoryId: number) {
   
  }
  onSubmit() {
    // Add logic to save the new category
   
  }
}
