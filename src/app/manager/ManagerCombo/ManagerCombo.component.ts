import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../Header/Header.component';
import { SideBarComponent } from '../SideBar/SideBar.component';
import { ManagerComboService } from '../../../service/managercombo.service';
import { AddNewCombo, ListAllCombo, UpdateCombo } from '../../../models/combo.model';

@Component({
  selector: 'app-ManagerCombo',
  templateUrl: './ManagerCombo.component.html',
  styleUrls: ['./ManagerCombo.component.css'],
  standalone: true,
  imports: [SideBarComponent, RouterModule, CommonModule, FormsModule, HeaderComponent]
})
export class ManagerComboComponent implements OnInit {
  @ViewChild('addComboModal') addComboModal!: ElementRef;
  combo: ListAllCombo[] = [];
  imageUrl: string = '';
  search: string = '';  
  currentPage: number = 1;
  pageSize: number = 5;
  totalCount: number = 0;
  selectedFile: File | null = null;
  selectedUpdateFile: File | null = null;
  totalPagesArray: number[] = [];
  addSuccessMessage: string = '';
  updateSuccessMessage: string = '';
  addErrorMessage: string = ''; 
  updateErrorMessage: string = '';
  addErrors = {
    nameComboError: '',
    priceError: '',
    noteError: '',
    imageError: '',
  };
  updateErrors = {
    nameComboError: '',
    priceError: '',
    noteError: '',
    imageError: '',
  };
  addNew: AddNewCombo = {
    nameCombo: '',
    price: 0,
    note: '',
    imageUrl: '',
    isActive: true,
    message: '',
  };
  updatedCombo: UpdateCombo = {
    comboId: 0,
    nameCombo: '', 
    price: 0, 
    note : '', 
    imageUrl: '',
    message: '',
  };
  constructor(private comboService: ManagerComboService) { }

  ngOnInit() {
    this.loadListCombo();
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
      this.selectedFile = fileInput.files[0];
      const imageUrl = URL.createObjectURL(this.selectedFile);
      this.addNew.imageUrl = imageUrl;
    }
  }
  
  updateCombo(): void {
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
        this.loadListCombo();
        this.resetForm();
        this.updateSuccessMessage = response.message;
        setTimeout(() => { this.updateSuccessMessage = ''; }, 5000);
      },
      (error) => {
        console.error('Error updating combo:', error);
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
        } else {
          this.updateErrorMessage = 'An error occurred. Please try again later.';
        }
      }
    );
  }
  createCombo(): void {
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
        this.addSuccessMessage = response.message;
        setTimeout(() => { this.addSuccessMessage = ''; }, 5000);
        this.resetForm();
      },
      (error) => {
        console.error('Error creating combo:', error);
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
        } else {
          this.addErrorMessage = 'An error occurred. Please try again later.';
        }
      }
    );
  }

  resetForm(): void {
    this.addNew = {
      nameCombo: '',
      price: 0,
      note: '',
      imageUrl: '',
      isActive: true,
      message: '',
    };
    this.selectedFile = null;
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
