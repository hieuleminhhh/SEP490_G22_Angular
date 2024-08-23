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

  enableEditing(): void {
    this.isEditing = true;
  }

  saveChanges(): void {
    this.isEditing = false;
    console.log('Saving info:', this.info[0]);

    // Xử lý qrcode nếu nó đã thay đổi
    if (this.info[0].qrcode && this.info[0].qrcode !== this.currentQrcodeUrl) {
      this.convertBlobToFile(this.info[0].qrcode).then(file => {
        this.uploadImage(file, 'qrcode');
      });

    } else if (!this.info[0].qrcode) {
      console.error('No qrcode URL returned from the server.');
    }

    // Xử lý logo nếu nó đã thay đổi
    if (this.info[0].logo && this.info[0].logo !== this.currentLogoUrl) {
      this.convertBlobToFile(this.info[0].logo).then(file => {
        this.uploadImage(file, 'logo');
      });
    } else if (!this.info[0].logo) {
      console.error('No logo URL returned from the server.');
    }

    const updatedInfo = { ...this.info[0] };
    if (updatedInfo.qrcode) {
      updatedInfo.qrcode = this.addPngExtensionIfNeeded(updatedInfo.qrcode);
    }
    if (updatedInfo.logo) {
      updatedInfo.logo = this.addPngExtensionIfNeeded(updatedInfo.logo);
    }

    console.log('Saving info:', updatedInfo);

    this.settingService.updateInfo(updatedInfo).subscribe(
      response => {
        console.log('Save success:', response);
        // Thực hiện hành động thêm nếu cần, chẳng hạn như upload hình ảnh
      },
      error => {
        console.error('Save error:', error);
        if (error.error) {
          console.error('Error details:', error.error);
        }
      }
    );
  }
  addPngExtensionIfNeeded(imageUrl: string): string {
    // Lấy tên tệp từ URL (nếu có), thêm đuôi .png nếu chưa có đuôi
    const urlParts = imageUrl.split('/');
    let fileName = urlParts.pop() || 'file';
    if (!fileName.includes('.')) {
      fileName += '.png'; // Thêm đuôi .png nếu chưa có đuôi
    }
    return fileName;
  }
  convertBlobToFile(blobUrl: string): Promise<File> {
    return fetch(blobUrl)
      .then(response => response.blob())
      .then(blob => {
        // Lấy tên tệp từ URL (nếu có), thêm đuôi .png nếu không có đuôi
        const urlParts = blobUrl.split('/');
        let fileName = urlParts.pop() || 'file';
        if (!fileName.includes('.')) {
          fileName += '.png'; // Thêm đuôi .png nếu chưa có đuôi
        }
        return new File([blob], fileName, { type: 'image/png' }); // Đặt loại MIME là image/png
      });
  }



  uploadImage(file: File, type: string): void {
    this.dishService.UploadImage(file).subscribe(
      (response) => {
        console.log(`${type} uploaded successfully:`, response.imageUrl);
      },
      (error) => {
        console.error(`Error uploading ${type}:`, error);
        if (error.error) {
          console.error('Error details:', error.error);
        }
      }
    );
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.getInfo(); // Reload info to discard changes
  }
  onUpdateImageSelect(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedUpdateFile = fileInput.files[0];
      if (this.info[0].qrcode) {
        URL.revokeObjectURL(this.info[0].qrcode); // Thu hồi URL blob cũ
      }
      const imageUrl = URL.createObjectURL(this.selectedUpdateFile);
      const cleanUrl = imageUrl.replace('blob:', ''); // Loại bỏ tiền tố 'blob:'
      this.info[0].qrcode = cleanUrl;
      console.log(this.info[0].qrcode);
    }
  }

  onUpdateLogoSelect(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedUpdateFile = fileInput.files[0];
      if (this.info[0].logo) {
        URL.revokeObjectURL(this.info[0].logo); // Thu hồi URL blob cũ
      }
      const imageUrl = URL.createObjectURL(this.selectedUpdateFile);
      const cleanUrl = imageUrl.replace('blob:', ''); // Loại bỏ tiền tố 'blob:'
      this.info[0].logo = cleanUrl;
      console.log(this.info[0].logo);
    }
  }




}
