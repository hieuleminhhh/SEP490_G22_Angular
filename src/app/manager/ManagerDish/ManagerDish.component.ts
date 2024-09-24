import { Component, OnInit, Inject, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ManagerDishService } from '../../../service/managerdish.service';
import { SideBarComponent } from '../SideBar/SideBar.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../models/category.model';
import { AddNewDish, ListAllDishes, ManagerDish, UpdateDish } from '../../../models/dish.model';
import { HeaderComponent } from "../Header/Header.component";
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { HeaderOrderStaffComponent } from "../../staff/ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";
import { SidebarAdminComponent } from "../../admin/SidebarAdmin/SidebarAdmin.component";
import { JwtInterceptor } from '../../../jwt.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-ManagerDish',
    templateUrl: './ManagerDish.component.html',
    styleUrls: ['./ManagerDish.component.css'],
    standalone: true,
    imports: [SideBarComponent, RouterModule, CommonModule, FormsModule, HeaderComponent, CurrencyFormatPipe, HeaderOrderStaffComponent, SidebarAdminComponent],
    providers: [
      { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
    ]
})
export class ManagerDishComponent implements OnInit {
  @ViewChild('addDishModal') addDishModal!: ElementRef;
  @ViewChild('updateDishModal') updateDishModal!: ElementRef;

  dishes: ListAllDishes[] = [];
  categories: Category[] = [];
  totalPagesArray: number[] = [];
  updatedDish: UpdateDish = {
    dishId: 0,
    itemName: '',
    itemDescription: '',
    price: null as number | null,
    imageUrl: '',
    categoryId: 0,
    message: '',
  };
  addNew: AddNewDish = {
    itemName: '',
    itemDescription: '',
    price: null as number | null,
    imageUrl: '',
    categoryId: 0,
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
  addErrorMessage: string = '';
  updateErrorMessage: string = '';
  successMessage: string = '';
  searchCategory: string = '';
  addErrors = {
    itemNameError: '',
    descriptionError: '',
    priceError: '',
    imageError: '',
    categoryError: '',
  };
  updateErrors = {
    itemNameError: '',
    descriptionError: '',
    priceError: '',
    imageError: '',
    categoryError: '',
  };
  constructor(@Inject(ManagerDishService) private dishService: ManagerDishService, private cdr: ChangeDetectorRef,  private titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Quản lý món ăn | Eating House');
    this.loadListDishes();
    this.loadCategories();
    this.loadListDisheSetting();
  }
  isDishInOrderMap: { [key: number]: boolean } = {};
  loadListDishes(search: string = ''): void {
    this.dishService.ListDishes(this.currentPage, this.pageSize, this.searchCategory, search).subscribe(
      (response) => {
        if (response && response.items) {
          // Keep wrapping response in an array
          this.dishes = [response];
          this.totalCount = response.totalCount;
          this.updateTotalPagesArray(response.totalPages);
  
          // Initialize the isDishInOrderMap
          this.isDishInOrderMap = {};
  
          // Iterate over response.items to check each dish
          response.items.forEach((dish: ManagerDish) => {
            this.dishService.checkDishInOrderDetails(dish.dishId).subscribe(
              (isInOrder: boolean) => {
                // Store the result in the map using dishId as the key
                this.isDishInOrderMap[dish.dishId] = isInOrder;
              },
              (error) => {
                console.error('Error checking if dish is in order details:', error);
              }
            );
          });
        } else {
          console.error('Invalid response:', response);
        }
      },
      (error) => {
        console.error('Error fetching dish:', error);
      }
    );
  }
  
  
  
  dishesetting: ListAllDishes[] = [];
  loadListDisheSetting(search: string = ''): void {
    this.dishService.ListDishes(this.currentPage, 100, this.searchCategory, search).subscribe(
      (response: ListAllDishes) => {
        if (response && response.items) {
          this.dishesetting = [response]; // Wrap response in an array
          const dishesItems = response.items; // Extract items from response

          // Initialize selectedDishes
          this.selectedDishes = {}; // Reset selectedDishes
          dishesItems.forEach(dish => {
            this.selectedDishes[dish.dishId] = false; // Initialize selection status
          });
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
    // Fetch the dish details
    this.dishService.getDishById(dishId).subscribe(
      (dish: UpdateDish) => {
        this.updatedDish = dish;
  
        // After fetching the dish, check if it is in any order
        this.dishService.checkDishInOrderDetails(dishId).subscribe(
          (isInOrder: boolean) => {
            // If the dish is in an order, disable the name field
            this.isDishInOrder = isInOrder;
          },
          (error) => {
            console.error('Error checking if dish is in order details:', error);
          }
        );
      },
      (error) => {
        console.error('Error fetching dish:', error);
      }
    );
  }
  
uploadImage(): void {
  if (this.selectedFile !== null) {
    this.dishService.UploadImage(this.selectedFile).subscribe(
      (response) => {
        console.log('Image uploaded successfully:', response);
        this.addNew.imageUrl = response.imageUrl;
      },
      (error) => {
        console.error('Error uploading image:', error);
        this.addErrorMessage = 'An error occurred while uploading the image. Please try again.';
      }
    );
  } else {
    console.error('No file selected.');
  }
}

createDish(): void {
  this.addErrorMessage = '';

  if (this.selectedFile) {
    this.dishService.UploadImage(this.selectedFile).subscribe(
      (response) => {
        console.log('Image uploaded successfully:', response);
        this.addNew.imageUrl = response.imageUrl;
        this.saveDish();
      },
      (error) => {
        console.error('Error uploading image:', error);
        this.addErrorMessage = 'Error uploading image. Please try again later.';
      }
    );
  } else {
    this.saveDish();
  }
}

onImageSelect(event: Event): void {
  const fileInput = event.target as HTMLInputElement;
  if (fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];

    // Optional: Validate file size (e.g., 2MB max)
    if (file.size > 2 * 1024 * 1024) {
      this.addErrors.imageError = 'File size exceeds 2MB';

      return;
    }
    // Create a URL for the selected file
    this.selectedFile = file;
    this.imageUrl = URL.createObjectURL(file);
  } else {

    this.addErrors.imageError = 'No file selected';
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
      modalBackdrop?.parentNode?.removeChild(modalBackdrop);
      this.successMessage = response.message;
      setTimeout(() => { this.successMessage = ''; }, 5000);
      this.loadListDishes();
      this.resetForm();
    },
    (error) => {
      console.error('Error creating dish:', error);
      this.clearAddErrors();
      if (error.error) {
        const fieldErrors = error.error;
        if (fieldErrors['itemName']) {
          this.addErrors.itemNameError = fieldErrors['itemName'];
        }
        if (fieldErrors['itemDescription']) {
          this.addErrors.descriptionError = fieldErrors['itemDescription'];
        }
        if (fieldErrors['price']) {
          this.addErrors.priceError = fieldErrors['price'];
        }
        if (fieldErrors['image']) {
          this.addErrors.imageError = fieldErrors['image'];
        }
        if (fieldErrors['categoryId']) {
          this.addErrors.categoryError = fieldErrors['categoryId'];
        }
      } else {
        this.addErrorMessage = 'An error occurred. Please try again later.';
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
        this.updatedDish.imageUrl = response.imageUrl;
        this.saveUpdatedDish();
      },
      (error) => {
        console.error('Error uploading image:', error);
        this.updateErrorMessage = 'An error occurred while uploading the image. Please try again.';
      }
    );
  } else {
    this.saveUpdatedDish();
  }
}

saveUpdatedDish(): void {
  this.dishService.UpdateDish(this.updatedDish).subscribe(
    (response) => {
      console.log('Dish updated successfully:', response);
      this.updateDishModal.nativeElement.classList.remove('show');
      this.updateDishModal.nativeElement.style.display = 'none';
      document.body.classList.remove('modal-open');
      const modalBackdrop = document.getElementsByClassName('modal-backdrop')[0];
      modalBackdrop?.parentNode?.removeChild(modalBackdrop);
      this.loadListDishes();
      this.resetUpdateForm();
      this.successMessage = response.message;
      setTimeout(() => { this.successMessage = ''; }, 5000);
    },
    (error) => {
      console.error('Error updating dish:', error);
      this.clearUpdateErrors();
      if (error.error) {
        const fieldErrors = error.error;
        if (fieldErrors['itemName']) {
          this.updateErrors.itemNameError = fieldErrors['itemName'];
        }
        if (fieldErrors['itemDescription']) {
          this.updateErrors.descriptionError = fieldErrors['itemDescription'];
        }
        if (fieldErrors['price']) {
          this.updateErrors.priceError = fieldErrors['price'];
        }
        if (fieldErrors['imageUrl']) {
          this.updateErrors.imageError = fieldErrors['imageUrl'];
        }
        if (fieldErrors['categoryId']) {
          this.updateErrors.categoryError = fieldErrors['categoryId'];
        }
      } else {
        this.updateErrorMessage = 'An error occurred. Please try again later.';
      }
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

clearAddErrors(): void {
  this.addErrors = {
    itemNameError: '',
    descriptionError: '',
    priceError: '',
    imageError: '',
    categoryError: '',
  };
}

clearUpdateErrors(): void {
  this.updateErrors = {
    itemNameError: '',
    descriptionError: '',
    priceError: '',
    imageError: '',
    categoryError: '',
  };
}

resetForm(): void {
  this.addNew = {
    itemName: '',
    itemDescription: '',
    price: 0,
    imageUrl: '',
    categoryId: 0,
    isActive: true,
    message:'',
  };
  this.imageUrl = '';
  this.clearAddErrors();
  this.addErrorMessage = '';
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
    categoryId: 0,
    message: '',
  };
  this.selectedUpdateFile = null;
  this.clearUpdateErrors();
  this.updateErrorMessage = '';
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
selectedDishes: { [key: number]: boolean } = {};

selectAll(event: any): void {
  const checked = event.target.checked;
  if (this.dishesetting.length > 0) {
    const dishesItems = this.dishesetting[0].items;
    dishesItems.forEach(dish => this.selectedDishes[dish.dishId] = checked);
  }
}
onDishSelectionChange(dishId: number, event: any): void {
  console.log(`Checkbox for dish ${dishId} changed to ${event.target.checked}`);
  this.selectedDishes[dishId] = event.target.checked;
}

quantityToSet: any;
applyQuantity(): void {
  // Iterate over dishes and update the quantity if the dish is selected
  for (const list of this.dishesetting) {
    for (const dish of list.items) {
      if (this.selectedDishes[dish.dishId]) {
        dish.quantityDish = this.quantityToSet;
        console.log(this.quantityToSet);
        console.log(dish.quantityDish);
        console.log(`Số lượng cho món ${dish.dishId} đã được đặt là ${this.quantityToSet}`);
      }
    }
  }

  this.cdr.detectChanges();
}
resetModal(): void {
  window.location.reload();
}
validateQuantity(event: Event) {
  const input = event.target as HTMLInputElement;
  const value = Number(input.value);
  if (value < 1) {
    input.value = '1';
    this.quantityToSet = 1;
  } else {
    this.quantityToSet = value;
  }
}
updateSelectedDishes() {
  this.dishesetting.forEach(list => {
    list.items.forEach(dish => {
      const body={
        dishId:dish.dishId,
        quantityDish:dish.quantityDish
      }
      if (this.selectedDishes[dish.dishId]) {
        this.dishService.UpdateDishQuantity(body)
          .subscribe({
            next: (response) => {
              console.log(`Dish ${dish.dishId} updated successfully`, response);
            },
            error: (error) => {
              console.error(`Error updating dish ${dish.dishId}`, error);
            }
          });
      }
    });
  });

  // // Optionally, close the modal after updating
  this.resetModal();
}
isDishInOrder: boolean = false;
deleteDish(dishId: number): void {
  this.dishService.DeleteDish(dishId).subscribe(
    (response) => {
      console.log('Delete response:', response);
      this.successMessage = 'Xóa món ăn thành công';
      this.loadListDishes();
    },
    (error) => {
      console.error('Error deleting dish:', error);

      // Show error message
      alert('Error deleting dish!');
    }
  );
}
private dishIdToDelete: number | null = null;
setDishIdForDeletion(dishId: number): void {
  this.dishIdToDelete = dishId;
}

// Method to confirm deletion
confirmDelete(): void {
  if (this.dishIdToDelete !== null) {
    this.deleteDish(this.dishIdToDelete);
    this.successMessage = 'Xóa món ăn thành công';

    // Clear the success message after 2 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 2000);
  }
}

}
