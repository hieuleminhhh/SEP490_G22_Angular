import { Component, OnInit, Inject } from '@angular/core';
import { ManagerDishService } from '../../../service/managerdish.service';
import { SideBarComponent } from '../SideBar/SideBar.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../models/category.model';
import { AddNewDish, ListAllDishes } from '../../../models/dish.model';
import { HeaderComponent } from "../Header/Header.component";

@Component({
    selector: 'app-ManagerDish',
    templateUrl: './ManagerDish.component.html',
    styleUrls: ['./ManagerDish.component.css'],
    standalone: true,
    imports: [SideBarComponent, RouterModule, CommonModule, FormsModule, HeaderComponent]
})
export class ManagerDishComponent implements OnInit {
  dishes: ListAllDishes[] = [];
  categories: Category[] = [];
  totalPagesArray: number[] = [];
  addNew: AddNewDish = {
    itemName: '',
    itemDescription: '',
    price: 0,
    imageUrl: '',
    categoryId: '',
    isActive: true,
  };
  imageUrl: string = '';
  search: string = '';  
  currentPage: number = 1;
  pageSize: number = 5;
  totalCount: number = 0;

  constructor(@Inject(ManagerDishService) private dishService: ManagerDishService) { }

  ngOnInit(): void {
    this.loadListDishes();
    this.loadCategories();
  }

  loadListDishes(search: string = ''): void {
    console.log('Loading dishes with search term:', search); 
    this.dishService.ListDishes(this.currentPage, this.pageSize, search).subscribe(
      (response: ListAllDishes) => {
        if (response && response.items) {
          this.dishes = [response];
          this.totalCount = response.totalCount;
          this.updateTotalPagesArray(response.totalPages);
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

  onSearch(): void {
    this.currentPage = 1;
    console.log('Search term:', this.search);  
    this.loadListDishes(this.search);
  }

  loadCategories(): void {
    this.dishService.GetCategories().subscribe(
      (categories: Category[]) => {
        this.categories = categories;
        console.log('Fetched categories:', categories);
      },
      (error) => {
        console.error('Error fetching categories:', error);
      }
    );
  }

  createDish(): void {
    this.addNew.imageUrl = this.imageUrl;
    this.dishService.AddNewDish(this.addNew).subscribe(
      (createdDish: AddNewDish) => {
        console.log('New dish created:', createdDish);
        this.loadListDishes();
        this.resetForm();
      },
      (error) => {
        console.error('Error creating dish:', error);
      }
    );
  }

  onFileChange(event: any): void {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      this.addNew.imageUrl = imageUrl;
    }
  }

  onImageSelect(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.dishService.UploadImage(file).subscribe(
        (response) => {
          console.log('Image uploaded successfully:', response);
          this.imageUrl = response.imageUrl;
        },
        (error) => {
          console.error('Error uploading image:', error);
          this.showErrorMessage('An error occurred while uploading the image. Please try again.');
        }
      );
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadListDishes(this.search);
  }

  updateTotalPagesArray(totalPages: number): void {
    this.totalPagesArray = Array(totalPages).fill(0).map((x, i) => i + 1);
  }

  showErrorMessage(message: string): void {
    console.error(message);
  }

  resetForm(): void {
    this.addNew = {
      itemName: '',
      itemDescription: '',
      price: 0,
      imageUrl: '',
      categoryId: '',
      isActive: false,
    };
    this.imageUrl = '';

    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  updateDishStatus(dishId: number, isActive: boolean): void {
    if (dishId === undefined || dishId === null) {
      console.error('Dish ID is not defined');
      return;
    }
    this.dishService.UpdateDishStatus(dishId, isActive).subscribe(
      (response) => {
        console.log('Dish status updated successfully:', response);
        this.loadListDishes(); // Reload the list to reflect the changes
      },
      (error) => {
        console.error('Error updating dish status:', error);
      }
    );
  }

  onCheckboxChange(event: Event, dishId: number): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      const isActive = target.checked;
      this.updateDishStatus(dishId, isActive);
    } else {
      console.error('Event target is null');
    }
  
}
}