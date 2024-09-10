import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../Header/Header.component';
import { SideBarComponent } from '../SideBar/SideBar.component';
import { ManagerComboService } from '../../../service/managercombo.service';
import { AddNewCombo, ListAllCombo, UpdateCombo } from '../../../models/combo.model';
import { AddNewDish, Dish, ManagerDish } from '../../../models/dish.model';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { HeaderOrderStaffComponent } from "../../staff/ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";

@Component({
  selector: 'app-ManagerCombo',
  templateUrl: './ManagerCombo.component.html',
  styleUrls: ['./ManagerCombo.component.css'],
  standalone: true,
  imports: [SideBarComponent, RouterModule, CommonModule, FormsModule, HeaderComponent, CurrencyFormatPipe, HeaderOrderStaffComponent]
})
export class ManagerComboComponent implements OnInit {
  @ViewChild('addComboModal') addComboModal!: ElementRef;
  @ViewChild('updateComboModal') updateComboModal!: ElementRef;
  @ViewChild('dishesSelect') dishesSelect!: ElementRef;
  combo: ListAllCombo[] = [];
  allDishes: Dish[] = [];
  selectedDishes: number[] = [];
  imageUrl: string = '';
  search: string = '';
  currentPage: number = 1;
  pageSize: number = 5;
  totalCount: number = 0;
  selectedFile: File | null = null;
  selectedUpdateFile: File | null = null;
  totalPagesArray: number[] = [];
  successMessage: string = '';
  addErrorMessage: string = '';
  updateErrorMessage: string = '';
  addErrors = {
    nameComboError: '',
    priceError: '',
    noteError: '',
    imageError: '',
    dishError: '',
  };
  updateErrors = {
    nameComboError: '',
    priceError: '',
    noteError: '',
    imageError: '',
    dishError: '',
  };
  addNew: AddNewCombo = {
    nameCombo: '',
    price: null as number | null,
    note: '',
    imageUrl: '',
    isActive: true,
    message: '',
    dishIds: [],
  };

  updatedCombo: UpdateCombo = {
    comboId: 0,
    nameCombo: '',
    price: null as number | null,
    note : '',
    imageUrl: '',
    message: '',
    dishIds: [],
  };
  constructor(private comboService: ManagerComboService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadListCombo();
    this.loadAllDishes();
  }





  loadListCombo(search: string = ''): void {
    console.log('Loading combos with search term:', search);
    this.comboService.ListCombo(this.currentPage, this.pageSize, search).subscribe(
      (response) => {
        if (response && response.items) {
          this.combo = [response];
          this.totalCount = response.totalCount;
          this.updateTotalPagesArray(response.totalPages);
          console.log('Fetched combos:', this.combo);
        } else {
          console.error('Invalid response:', response);
        }
      },
      (error) => {
        console.error('Error fetching combos:', error);
      }
    );
  }
  selectedCombos: { [key: number]: boolean } = {};

  loadListDisheSetting(search: string = ''): void {
    this.comboService.ListCombo(this.currentPage, this.pageSize, search).subscribe(
      (response: ListAllCombo) => {
        if (response && response.items) {
          this.combo = [response]; // Wrap response in an array
          const comboItems = response.items; // Extract items from response

          // Initialize selectedDishes
          this.selectedCombos = {}; // Reset selectedDishes
          comboItems.forEach(combo => {
            this.selectedCombos[combo.comboId] = false; // Initialize selection status
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
  loadAllDishes(): void {
    this.comboService.getAllDishes().subscribe(
      (dishes: Dish[]) => {
        this.allDishes = dishes;
      },
      (error) => {
        console.error('Error fetching dishes:', error);
      }
    );
  }

  getComboById(comboId: number): void {
    this.comboService.getComboById(comboId).subscribe(
      (combo: UpdateCombo) => {
        this.updatedCombo = combo;
      },
      (error) => {
        console.error('Error fetching combo:', error);
      }
    );
}
  updateTotalPagesArray(totalPages: number): void {
    this.totalPagesArray = Array(totalPages).fill(0).map((x, i) => i + 1);
  }

  updateComboStatus(comboId: number, isActive: boolean): void {
    if (comboId === undefined || comboId === null) {
      console.error('Combo ID is not defined');
      return;
    }
    this.comboService.UpdateComboStatus(comboId, isActive).subscribe(
      (response) => {
        console.log('Combo status updated successfully:', response);
        this.loadListCombo();
      },
      (error) => {
        console.error('Error updating combo status:', error);
      }
    );
  }

  onCheckboxChange(event: Event, comboId: number): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      const isActive = target.checked;
      this.updateComboStatus(comboId, isActive);
    } else {
      console.error('Event target is null');
    }
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadListCombo(this.search);
  }
  onSearch(): void {
    this.currentPage = 1;
    console.log('Search term:', this.search);
    this.loadListCombo(this.search);
  }
  onUpdateImageSelect(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedUpdateFile = fileInput.files[0];
      const imageUrl = URL.createObjectURL(this.selectedUpdateFile);
      this.updatedCombo.imageUrl = imageUrl;
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
  uploadImage(): void {
    if (this.selectedFile !== null) {
      this.comboService.UploadImage(this.selectedFile).subscribe(
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
  updateCombo(selectedDishes: number[]): void {
    console.log('Selected dishes:', selectedDishes);
    this.updatedCombo.dishIds = selectedDishes;
    if (this.selectedUpdateFile) {
      this.comboService.UploadImage(this.selectedUpdateFile).subscribe(
        (response) => {
          console.log('Image uploaded successfully:', response);
          this.updatedCombo.imageUrl = response.imageUrl;
          this.saveUpdatedCombo();
        },
        (error) => {
          console.error('Error uploading image:', error);
        }
      );
    } else {
      this.saveUpdatedCombo();
    }
  }
  saveUpdatedCombo(): void {
    this.comboService.UpdateCombo(this.updatedCombo).subscribe(
      (response) => {
        console.log('Combo updated successfully:', response.nameCombo);
        this.updateComboModal.nativeElement.classList.remove('show');
        this.updateComboModal.nativeElement.style.display = 'none';
        document.body.classList.remove('modal-open');
        const modalBackdrop = document.getElementsByClassName('modal-backdrop')[0];
        modalBackdrop?.parentNode?.removeChild(modalBackdrop);
        this.loadListCombo();
        this.resetUpdateForm();
        this.successMessage = response.message;
        setTimeout(() => { this.successMessage = ''; }, 5000);
      },
      (error) => {
        console.error('Error updating combo:', error);
        this.clearUpdateErrors();
        if (error.error) {
          const fieldErrors = error.error;
          if (fieldErrors['nameCombo']) {
            this.updateErrors.nameComboError = fieldErrors['nameCombo'];
            console.log(fieldErrors['nameCombo']);
          }
          if (fieldErrors['price']) {
            this.updateErrors.priceError = fieldErrors['price'];
          }
          if (fieldErrors['note']) {
            this.updateErrors.noteError = fieldErrors['note'];
          }
          if (fieldErrors['imageUrl']) {
            this.updateErrors.imageError = fieldErrors['imageUrl'];
          }
          if (fieldErrors['dish']) {
            this.addErrors.dishError = fieldErrors['dish'];
          }
        } else {
          this.updateErrorMessage = 'An error occurred. Please try again later.';
        }
      }
    );
  }

  createCombo(selectedDishes: number[]): void {
    console.log('Selected dishes:', selectedDishes);
    this.addNew.dishIds = selectedDishes;
    this.addErrorMessage = '';
    if (this.selectedFile) {
      this.comboService.UploadImage(this.selectedFile).subscribe(
        (response) => {
          console.log('Image uploaded successfully:', response);
          this.addNew.imageUrl = response.imageUrl;
          this.saveCombo();
        },
        (error) => {
          console.error('Error uploading image:', error);
          this.addErrorMessage = 'Error uploading image. Please try again later.';
        }
      );
    } else {
      this.saveCombo();
    }
  }


  saveCombo(): void {
    this.comboService.AddNewCombo(this.addNew).subscribe(
      (response) => {
        console.log('Combo created successfully:', response);
        this.addComboModal.nativeElement.classList.remove('show');
        this.addComboModal.nativeElement.style.display = 'none';
        document.body.classList.remove('modal-open');
        const modalBackdrop = document.getElementsByClassName('modal-backdrop')[0];
        modalBackdrop?.parentNode?.removeChild(modalBackdrop);
        this.successMessage = response.message;
        setTimeout(() => { this.successMessage = ''; }, 5000);
        this.loadListCombo();
        this.resetForm();
      },
      (error) => {
        console.error('Error creating combo:', error);
        this.clearAddErrors();
        if (error.error) {
          const fieldErrors = error.error;
          if (fieldErrors['nameCombo']) {
            this.addErrors.nameComboError = fieldErrors['nameCombo'];
          }
          if (fieldErrors['price']) {
            this.addErrors.priceError = fieldErrors['price'];
          }
          if (fieldErrors['note']) {
            this.addErrors.noteError = fieldErrors['note'];
          }
          if (fieldErrors['imageUrl']) {
            this.addErrors.imageError = fieldErrors['imageUrl'];
          }
          if (fieldErrors['dish']) {
            this.addErrors.dishError = fieldErrors['dish'];
          }
        } else {
          this.addErrorMessage = 'An error occurred. Please try again later.';
        }
      }
    );
  }


  clearAddErrors(): void {
    this.addErrors = {
      nameComboError: '',
      priceError: '',
      imageError: '',
      noteError: '',
      dishError:'',
    };
  }
  clearUpdateErrors(): void {
    this.updateErrors = {
      nameComboError: '',
      priceError: '',
      imageError: '',
      noteError: '',
      dishError:'',
    };
  }
  resetForm(): void {
    this.addNew = {
      nameCombo: '',
      price: 0,
      note: '',
      imageUrl: '',
      isActive: true,
      message: '',
      dishIds: [],
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
    this.addNew = {
      nameCombo: '',
      price: 0,
      note: '',
      imageUrl: '',
      isActive: true,
      message: '',
      dishIds: [],
    };
    this.imageUrl = '';
    this.clearUpdateErrors();
    this.addErrorMessage = '';
    this.selectedDishes =[];
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  quantityToSet: number = 1;
applyQuantity(): void {
  // Iterate over dishes and update the quantity if the dish is selected
  for (const list of this.combo) {
    for (const combos of list.items) {
      if (this.selectedCombos[combos.comboId]) {
        // Update the quantityDish property of the dish
        combos.quantityCombo = this.quantityToSet;
        console.log(`Số lượng cho món ${combos.comboId} đã được đặt là ${this.quantityToSet}`);
      }
    }
  }

  // Force Angular to detect changes
  this.cdr.detectChanges();
}
onComboSelectionChange(comboId: number, event: any): void {
  console.log(`Checkbox for dish ${comboId} changed to ${event.target.checked}`);
  this.selectedCombos[comboId] = event.target.checked;
}
selectAll(event: any): void {
  const checked = event.target.checked;
  if (this.combo.length > 0) {
    const dishesItems = this.combo[0].items;
    dishesItems.forEach(combo => this.selectedCombos[combo.comboId] = checked);
  }
}
validateQuantity(event: Event) {
  const input = event.target as HTMLInputElement;
  const value = Number(input.value);

  if (value < 1) {
    input.value = '1'; // Reset input value to 1 if less than 1
    this.quantityToSet = 1; // Update model to ensure consistency
  } else {
    this.quantityToSet = value; // Update model if value is valid
  }
}
updateSelectedCombos() {
  this.combo.forEach(list => {
    list.items.forEach(combos => {
      const body={
        comboId:combos.comboId,
        quantityCombo: combos.quantityCombo
      }
      if (this.selectedCombos[combos.comboId]) {
        this.comboService.UpdateComboQuantity(body)
          .subscribe({
            next: (response) => {
              console.log(`Combo ${combos.comboId} updated successfully`, response);
            },
            error: (error) => {
              console.error(`Error updating dish ${combos.comboId}`, error);
            }
          });
      }
    });
  });

  // // Optionally, close the modal after updating
  this.resetModal();
}
resetModal(): void {
  window.location.reload();
}
}
