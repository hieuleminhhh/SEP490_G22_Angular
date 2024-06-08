import { Component, OnInit, Inject, ElementRef, ViewChild } from '@angular/core';
import { ManagerDishService } from '../../../service/managerdish.service';
import { SideBarComponent } from '../SideBar/SideBar.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../models/category.model';
import { AddNewDish, ListAllDishes, ManagerDish, UpdateDish } from '../../../models/dish.model';
import { HeaderComponent } from "../Header/Header.component";

@Component({
    selector: 'app-ManagerDish',
    templateUrl: './ManagerDish.component.html',
    styleUrls: ['./ManagerDish.component.css'],
    standalone: true,
    imports: [SideBarComponent, RouterModule, CommonModule, FormsModule, HeaderComponent]
})
export class ManagerDishComponent implements OnInit {
  @ViewChild('addDishModal') addDishModal!: ElementRef;
  dishes: ListAllDishes[] = [];
  categories: Category[] = [];
  totalPagesArray: number[] = [];
  updatedDish: UpdateDish = {
    dishId: 0,
    itemName: '', 
    itemDescription: '', 
    price: 0, 
    imageUrl: '',
    categoryId: '',
  };
  addNew: AddNewDish = {
    itemName: '',
    itemDescription: '',
    price: 0,
    imageUrl: '',
    categoryId: '',
    isActive: true,
    message: '',
  };
  imageUrl: string = '';
  search: string = '';  
  currentPage: number = 1;
  pageSize: number = 5;
  totalCount: number = 0;
  selectedFile: File | null = null;
  selectedUpdateFile: File | null = null;
  errorMessage: string = ''; 
  itemNameError: string = '';
  descriptionError: string = '';
  priceError: string = '';
  imageError: string = '';
  categoryError: string = '';
  addSuccessMessage: string = '';
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


  getDishById(dishId: number): void {
    this.dishService.getDishById(dishId).subscribe(
      (dish: UpdateDish) => {
        this.updatedDish = dish;
      },
      (error) => {
        console.error('Error fetching dish:', error);
      }
    );
}

onImageSelect(event: Event): void {
  const fileInput = event.target as HTMLInputElement;
  if (fileInput.files && fileInput.files.length > 0) {
    this.selectedFile = fileInput.files[0];
    const imageUrl = URL.createObjectURL(this.selectedFile);
    this.addNew.imageUrl = imageUrl;
  }
}

createDish(): void {
  this.errorMessage = '';

  if (this.selectedFile) {
    this.dishService.UploadImage(this.selectedFile).subscribe(
      (response) => {
        console.log('Image uploaded successfully:', response);
        this.addNew.imageUrl = response.imageUrl;
        this.saveDish();
      },
      (error) => {
        console.error('Error uploading image:', error);
        this.errorMessage = 'An error occurred while uploading the image. Please try again.';
      }
    );
  } else {
    this.saveDish();
  }
}

saveDish(): void {
  this.dishService.AddNewDish(this.addNew).subscribe(
    (response) => {
      console.log('Dish created successfully:', response);
      this.addDishModal.nativeElement.classList.remove('show');
      this.addDishModal.nativeElement.style.display = 'none';
      document.body.classList.remove('modal-open');
      const modalBackdrop = document.getElementsByClassName('modal-backdrop')[0];
      modalBackdrop.parentNode?.removeChild(modalBackdrop);
      this.addSuccessMessage = response.message;
  setTimeout(() => { this.addSuccessMessage = ''; }, 5000);
    },
    (error) => {
      console.error('Error creating dish:', error);
      if (error.error) {
        const fieldErrors = error.error;
        if (fieldErrors['itemName']) {
          this.itemNameError = fieldErrors['itemName'];
        } else {
          this.itemNameError = ''; 
        }
        if (fieldErrors['itemDescription']) {
          this.descriptionError = fieldErrors['itemDescription'];
        } else {
          this.descriptionError = '';
        }
        if (fieldErrors['price']) {
          this.priceError = fieldErrors['price'];
        } else {
          this.priceError = '';
        }
        if (fieldErrors['imageUrl']) {
          this.imageError = fieldErrors['imageUrl'];
        } else {
          this.imageError = '';
        }
        if (fieldErrors['categoryId']) {
          this.categoryError = fieldErrors['categoryId'];
        } else {
          this.categoryError = '';
        }
      } else {
        this.errorMessage = 'An error occurred. Please try again later.';
      }
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
onUpdateImageSelect(event: Event): void {
  const fileInput = event.target as HTMLInputElement;
  if (fileInput.files && fileInput.files.length > 0) {
    this.selectedUpdateFile = fileInput.files[0];
    const imageUrl = URL.createObjectURL(this.selectedUpdateFile);
    this.updatedDish.imageUrl = imageUrl;  
  }
}

updateDish(): void {
  if (this.selectedUpdateFile) {
    this.dishService.UploadImage(this.selectedUpdateFile).subscribe(
      (response) => {
        console.log('Image uploaded successfully:', response);
        this.updatedDish.imageUrl = response.imageUrl;  // Use the uploaded image URL
        this.saveUpdatedDish();
      },
      (error) => {
        console.error('Error uploading image:', error);
        this.showErrorMessage('An error occurred while uploading the image. Please try again.');
      }
    );
  } else {
    this.saveUpdatedDish();
  }
}

saveUpdatedDish(): void {
  this.dishService.UpdateDish(this.updatedDish).subscribe(
    (updatedDish: UpdateDish) => {
      console.log('Dish updated successfully:', updatedDish);
      this.loadListDishes();
      this.resetUpdateForm();
    },
    (error) => {
      console.error('Error updating dish:', error);
    }
  );
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
      isActive: true,
      message:'',
    };
    this.imageUrl = '';

    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  resetUpdateForm(): void {

    this.updatedDish = { 
    dishId: 0,
    itemName: '', 
    itemDescription: '', 
    price: 0, 
    imageUrl: '',
    categoryId: '',};
    this.selectedUpdateFile = null;
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  
  updateDishStatus(dishId: number, isActive: boolean): void {
    if (dishId === undefined || dishId === null) {
      console.error('Dish ID is not defined');
      return;
    }
    this.dishService.UpdateDishStatus(dishId, isActive).subscribe(
      (response) => {
        console.log('Dish status updated successfully:', response);
        this.loadListDishes(); 
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