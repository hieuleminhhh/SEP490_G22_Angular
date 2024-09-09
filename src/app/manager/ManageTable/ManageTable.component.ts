import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { JwtInterceptor } from '../../../jwt.interceptor';
import { SidebarAdminComponent } from '../../admin/SidebarAdmin/SidebarAdmin.component';
import { CurrencyFormatPipe } from '../../common/material/currencyFormat/currencyFormat.component';
import { HeaderOrderStaffComponent } from '../../staff/ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component';
import { HeaderComponent } from '../Header/Header.component';
import { SideBarComponent } from '../SideBar/SideBar.component';
import { Table } from '../../../models/table.model';
import { TableService } from '../../../service/table.service';

@Component({
  selector: 'app-ManageTable',
  templateUrl: './ManageTable.component.html',
  styleUrls: ['./ManageTable.component.css'],
  standalone: true,
  imports: [SideBarComponent, RouterModule, CommonModule, FormsModule, HeaderComponent, CurrencyFormatPipe, HeaderOrderStaffComponent, SidebarAdminComponent],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ]
})
export class ManageTableComponent implements OnInit {
  selectedFloor = 1;
  dataTable: any;
  originalDataTable: Table[] = [];
  selectedTable: string = 'all';
  capacity: number = 1;
  newFloor: any;
  floors: number[] = [];
  errorMessage: string = '';
  newTable: number = 0;
  capacityError: string | null = null;
  selectedTableId: any;
  tableDetail: any = {};
  tableToDelete: any;
  tableToEdit: any;
  isTableDetailsVisible: boolean = false;

  @ViewChild('addFloorModal') addFloorModal!: ElementRef;
  @ViewChild('manageTablesModal') manageTablesModal!: ElementRef;
  @ViewChild('tableDetailsModal') tableDetailsModal!: ElementRef;
  @ViewChild('confirmDeleteModal') confirmDeleteModal!: ElementRef;
  @ViewChild('confirmEditModal') confirmEditModal!: ElementRef;

  constructor(private tableService: TableService) { }

  ngOnInit(): void {

    this.getTableData();
    console.log(this.dataTable);

  }

  getTableData(): void {
    this.tableService.getTables().subscribe(
      response => {
        this.originalDataTable = response; // Lưu dữ liệu ban đầu
        this.dataTable = [...this.originalDataTable];
        this.filterTablesByFloorAndStatus(this.selectedTable);

        // Tính toán newTable là tableId cuối cùng + 1
        const tableIds = this.originalDataTable.map(table => table.tableId);
        this.newTable = Math.max(...tableIds) + 1; // Lấy tableId lớn nhất và cộng thêm 1

        this.floors = this.getFloors();
      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  filterTablesByFloorAndStatus(selectedTable: string): void {
    const currentFloor = this.selectedFloor;
    if (selectedTable === 'all') {
      // Nếu chọn 'all', hiển thị tất cả các bàn của tầng đang chọn
      this.dataTable = this.originalDataTable.filter(table => table.floor === currentFloor);
    } else if (selectedTable === 'empty') {
      // Nếu chọn 'empty', chỉ hiển thị các bàn trống của tầng đang chọn
      this.dataTable = this.originalDataTable.filter(table => table.floor === currentFloor && table.status === 0);
    }
  }

  getFloors(): number[] {
    const uniqueFloors = new Set<number>();
    if (Array.isArray(this.originalDataTable)) {
      this.originalDataTable.forEach(table => {
        uniqueFloors.add(table.floor);
      });
    } else {
      console.error('originalDataTable is not an array:', this.originalDataTable);
    }
    return Array.from(uniqueFloors).sort((a, b) => a - b);
  }

  getTableOFFloor(floor: number) {
    this.selectedFloor = floor;
    this.filterTablesByFloorAndStatus(this.selectedTable);
  }

  submitForm(): void {
    this.validateCapacity();
    if (!this.capacityError && this.newTable !== null && this.selectedFloor) {
      const newTableData = {
        status: 0,
        capacity: this.capacity,
        floor: this.selectedFloor
      };
      this.tableService.createTables(newTableData).subscribe(
        response => {
          console.log('Bàn đã được thêm thành công:', response);
          this.getTableData();
          this.closeManageTablesModal();
        },
        error => {
          console.error('Error khi thêm bàn:', error);
        }
      );
    } else {
      console.error('Thông tin bàn không hợp lệ.');
    }
  }

  submitNewFloor(): void {
    if (this.newFloor && !this.floors.includes(this.newFloor)) {
      this.floors.push(this.newFloor);
      this.selectedFloor = this.newFloor;
      this.newFloor = null;
      this.errorMessage = '';
      this.closeAddFloorModal();
      this.openManageTablesModal();
    } else if (this.floors.includes(this.newFloor)) {
      this.errorMessage = 'Tầng đã tồn tại!';
    } else {
      this.errorMessage = 'Vui lòng nhập một số hợp lệ!';
    }
  }

  openManageTablesModal() {
    const modal = this.manageTablesModal.nativeElement;
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      this.removeExistingBackdrop();
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }
  openAddFloorModal() {
    this.closeManageTablesModal();
    const modal = this.addFloorModal.nativeElement;
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  closeAddFloorModal() {
    const modal = this.addFloorModal.nativeElement;
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      this.updateBackdrop();
    }
    this.openManageTablesModal();
  }

  closeManageTablesModal() {
    const modal = this.manageTablesModal.nativeElement;
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');

      // Xóa backdrop nếu không còn modal nào mở
      this.removeExistingBackdrop();
    }
  }
  removeExistingBackdrop() {
    const existingBackdrop = document.querySelector('.modal-backdrop');
    if (existingBackdrop) {
      existingBackdrop.remove();
    }
  }
  private updateBackdrop() {
    const modals = document.querySelectorAll('.modal.show');
    if (modals.length === 0) {
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
      document.body.classList.remove('modal-open');
    }
  }
  validateCapacity(): void {
    if (this.capacity < 1 || this.capacity > 20) {
      this.capacityError = 'Số chỗ ngồi phải nằm trong khoảng từ 1 đến 20.';
    } else {
      this.capacityError = null; // Reset error message if valid
    }
  }
  showTableDetails(table: any): void {
    this.getTableById(table.tableId);

  }

  openTableDetails(): void {
    const modal = this.tableDetailsModal.nativeElement;
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  // Đóng modal hiển thị thông tin bàn
  closeTableDetailsModal(): void {
    const modal = this.tableDetailsModal.nativeElement;
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      // Xóa backdrop nếu không còn modal nào mở
      this.removeExistingBackdrop();
    }
  }
  getTableById(id: number): void {
    this.tableService.getTablesById(id).subscribe(
      response => {
        console.log(response);
        this.tableDetail = response;
        this.openTableDetails();
      },
      error => {
        console.error('Error khi thêm bàn:', error);
      }
    );
  }

  deleteTable(table: any): void {
    this.tableToDelete = table; // Lưu bàn cần xóa
    this.openConfirmDeleteModal(); // Mở modal xác nhận
  }

  openConfirmDeleteModal(): void {
    this.isTableDetailsVisible = true; // Đánh dấu modal chi tiết đang hiển thị
    this.closeTableDetailsModal(); // Đóng modal chi tiết trước

    const modal = this.confirmDeleteModal.nativeElement;
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }
  closeConfirmDeleteModal(): void {
    const modal = this.confirmDeleteModal.nativeElement;
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      this.removeExistingBackdrop();

      // Nếu modal chi tiết đã được mở trước đó, mở lại modal chi tiết
      if (this.isTableDetailsVisible) {
        this.openTableDetails();
        this.isTableDetailsVisible = false; // Reset trạng thái
      }
    }
  }

  confirmDeleteTable(): void {
    if (this.tableToDelete) {
      this.tableService.deleteTable(this.tableToDelete.tableId).subscribe(
        () => {
          console.log('Bàn đã được xóa thành công!');
          this.getTableData(); // Tải lại danh sách bàn sau khi xóa
          this.closeConfirmDeleteModal(); // Đóng modal xác nhận
          this.closeTableDetailsModal();
          window.location.reload();
          // Không mở lại modal chi tiết ở đây
        },
        error => {
          console.error('Error deleting table:', error);
          // Nếu có lỗi trong quá trình xóa, mở lại modal chi tiết
          this.openTableDetails();
        }
      );
    }
  }
  get tableStatus(): number {
    // Nếu status là 0 hoặc 1, trả về 1 để hiển thị 'Đang hoạt động'
    return this.tableDetail.status === 0 || this.tableDetail.status === 1 ? 1 : 2;
  }

  set tableStatus(value: any) {
    console.log(value);

    if (value === "1") {
      this.tableDetail.status = 0;
      console.log(this.tableDetail.status);

    } else {
      this.tableDetail.status = 2;
      console.log(this.tableDetail.status);

    }
  }

  editTable(table: any): void {
    this.tableToEdit = table; // Lưu bàn cần chỉnh sửa
    this.openConfirmEditModal(); // Mở modal xác nhận
  }

  openConfirmEditModal(): void {
    this.isTableDetailsVisible = true; // Đánh dấu modal chi tiết đang hiển thị
    this.closeTableDetailsModal(); // Đóng modal chi tiết trước

    const modal = this.confirmEditModal.nativeElement;
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  closeConfirmEditModal(): void {
    const modal = this.confirmEditModal.nativeElement;
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      this.removeExistingBackdrop();

      // Nếu modal chi tiết đã được mở trước đó, mở lại modal chi tiết
      if (this.isTableDetailsVisible) {
        this.openTableDetails();
        this.isTableDetailsVisible = false; // Reset trạng thái
      }
    }
  }

  confirmEditTable(tableDetail:any): void {
    if (this.tableToEdit) {
      // Gọi hàm để thực hiện cập nhật thay đổi
      this.updateTable(tableDetail);
    }
  }
  // Phương thức chỉnh sửa bàn
  updateTable(tableDetail: any): void {
    const request = {
      status: tableDetail.status,
      capacity: tableDetail.capacity,
      floor: tableDetail.floor
    }
    console.log(this.tableDetail.status);

    this.tableService.updateTable(this.tableDetail.tableId, request).subscribe(
      response => {
        const index = this.originalDataTable.findIndex(table => table.tableId === this.tableDetail.tableId);
        if (index !== -1) {
          this.originalDataTable[index] = response; // Cập nhật thông tin bàn
          this.dataTable[index] = response; // Cập nhật dữ liệu hiển thị
        }
        this.closeTableDetailsModal(); // Đóng modal
        window.location.reload();
      },
      error => {
        console.error('Error updating table:', error);
      }
    );
  }


}
