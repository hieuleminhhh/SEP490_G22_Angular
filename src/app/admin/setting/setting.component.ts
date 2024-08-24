import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SettingService } from '../../../service/setting.service';
import { ManagerDishService } from '../../../service/managerdish.service';
import { SidebarAdminComponent } from "../SidebarAdmin/SidebarAdmin.component";
import { HeaderOrderStaffComponent } from "../../staff/ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";

@Component({
  selector: 'app-setting',
  standalone: true,
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarAdminComponent, HeaderOrderStaffComponent]
})
export class SettingComponent implements OnInit {

  info: any;
  isEditing: boolean = false;
  selectedFile: File | null = null;
  selectedUpdateFile: File | null = null;
  successMessage: string | null = null;

  currentQrcodeUrl: string | null = null;
  currentLogoUrl: string | null = null;


  constructor(private settingService: SettingService, private dishService: ManagerDishService) { }

  ngOnInit(): void {
    this.getInfo();
  }

  getInfo(): void {
    this.settingService.getInfo().subscribe(
      response => {
        this.info = response;
        console.log(response);
        this.currentQrcodeUrl = this.info[0].qrcode;
        this.currentLogoUrl = this.info[0].logo;

      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.info[0].logo = e.target.result;  // Hiển thị ảnh mới trên giao diện
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
  
  onQRCodeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedUpdateFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.info[0].qrcode = e.target.result;  // Hiển thị ảnh mới trên giao diện
      };
      reader.readAsDataURL(this.selectedUpdateFile);
    }
  }
  saveChanges(): void {
    if (this.selectedFile) {
      this.settingService.UploadImage(this.selectedFile).subscribe(
        response => {
          this.info[0].logo = response.imageUrl;
          this.finalizeUpdate();  // Sau khi tải ảnh lên, cập nhật thông tin
        },
        error => {
          console.error('Error uploading logo:', error);
        }
      );
    } else if (this.selectedUpdateFile) {
      this.settingService.UploadImage(this.selectedUpdateFile).subscribe(
        response => {
          this.info[0].qrcode = response.imageUrl;
          this.finalizeUpdate();  // Sau khi tải ảnh lên, cập nhật thông tin
        },
        error => {
          console.error('Error uploading QR code:', error);
        }
      );
    } else {
      this.finalizeUpdate();  // Nếu không có ảnh mới, chỉ cập nhật thông tin
    }
  }
  
  finalizeUpdate(): void {
    this.settingService.updateInfo(this.info[0]).subscribe(
      response => {
        console.log('Info updated successfully:', response);
        this.getInfo();
        this.successMessage = 'Cập nhập thông tin quán ăn thành công';  // Set success message
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      },
      error => {
        console.error('Error updating info:', error);
        this.successMessage = '';  // Set error message
        setTimeout(() => this.successMessage = null, 3000);  // Clear message after 3 seconds
      }
    );
  }
  

  




}
