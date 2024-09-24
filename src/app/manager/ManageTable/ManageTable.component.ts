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
import { Title } from '@angular/platform-browser';

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
  selectedFloor: string = '';
  dataTable: any;
  originalDataTable: Table[] = [];
  selectedTable: string = 'all';
  capacity: number = 1;
  newFloor: any;
  floors: string[] = [];
  errorMessage: string = '';
  newTable: string = '';
  capacityError: string | null = null;
  selectedTableId: any;
  tableDetail: any = {};
  tableToDelete: any;
  tableToEdit: any;
  isTableDetailsVisible: boolean = false;
  isTableNameInvalid: boolean = false;
  isDetail: boolean = false;
  isEditing: boolean = false;
  newSelectedFloor: string = '';
  waitingTables: any[] = [];
  isWaitingTableView: boolean = false;
  isFloorInvalid: boolean = false;
  allTable: any;
  isNameDuplicate: boolean = false;
  lableTable: string = '';
  message: string = '';

  @ViewChild('addFloorModal') addFloorModal!: ElementRef;
  @ViewChild('manageTablesModal') manageTablesModal!: ElementRef;
  @ViewChild('tableDetailsModal') tableDetailsModal!: ElementRef;
  @ViewChild('confirmDeleteModal') confirmDeleteModal!: ElementRef;
  @ViewChild('confirmEditModal') confirmEditModal!: ElementRef;
  @ViewChild('editFloorModal') editFloorModal!: ElementRef;
  @ViewChild('confirmDeleteFloorModal') confirmDeleteFloorModal!: ElementRef;

  constructor(private tableService: TableService, private titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Quản lý phòng/bàn | Eating House');
    this.getTableData();
  }

  getTableData(): void {
    this.tableService.getTables().subscribe(
      response => {
        this.originalDataTable = response;
        this.allTable = response;
        this.selectedFloor = this.allTable[0].floor;
        this.dataTable = [...this.originalDataTable];
        this.filterTablesByFloorAndStatus(this.selectedTable);
        const tableIds = this.originalDataTable.map(table => table.tableId);
        this.floors = this.getFloors();
        console.log(this.allTable);

      },
      error => {
        console.error('Error:', error);
      }
    );
  }

  filterTablesByFloorAndStatus(selectedTable: string): void {
    const currentFloor = this.selectedFloor;
    if (selectedTable === 'all') {
      this.dataTable = this.originalDataTable.filter(table => table.floor === currentFloor);
    } else if (selectedTable === 'empty') {
      this.dataTable = this.originalDataTable.filter(table => table.floor === currentFloor && table.status === 0);
    }
  }

  getFloors(): string[] {
    const uniqueFloors = new Set<string>();

    if (Array.isArray(this.originalDataTable)) {
      this.originalDataTable.forEach(table => {
        if (table.floor !== null && table.floor !== undefined) { // Kiểm tra giá trị null hoặc undefined
          uniqueFloors.add(table.floor);
        }
      });
    } else {
      console.error('originalDataTable is not an array:', this.originalDataTable);
    }

    return Array.from(uniqueFloors).sort(); // Sắp xếp chuỗi thay vì số
  }



  getTableOFFloor(floor: string) {
    this.selectedFloor = floor;
    this.isWaitingTableView = false;
    this.filterTablesByFloorAndStatus(this.selectedTable);
  }
  checkTableName() {
    const isDuplicate = this.allTable.some((table: { lable: string; }) => table.lable === this.lableTable.trim());
    this.isNameDuplicate = isDuplicate;

    // Cập nhật thông điệp
    this.message = isDuplicate ? 'Tên bàn đã tồn tại!' : '';
  }

  submitForm(): void {
    this.validateCapacity();
    this.checkTableName();
    if (!this.lableTable || this.lableTable.trim() === '') {
      this.message = 'Tên bàn không được để trống!';
      this.isNameDuplicate = false;
      return;
    }
    if (!this.capacityError && this.selectedFloor && !this.isNameDuplicate) {
      const newTableData = {
        status: 0,
        capacity: this.capacity,
        floor: this.selectedFloor,
        lable: this.lableTable
      };
      console.log(newTableData);

      this.tableService.createTables(newTableData).subscribe(
        response => {
          console.log('Bàn đã được thêm thành công:', response);
          this.getTableData();
          this.closeManageTablesModal();
          window.location.reload();
        },
        error => {
          console.error('Error khi thêm bàn:', error);
        }
      );
    } else {
      console.error('Thông tin phòng/bàn không hợp lệ.');
    }
  }

  submitNewFloor(): void {
    if (!this.newFloor) {
      this.errorMessage = 'Khu vực không được để trống!';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
      return;
    }
    if (!this.floors.includes(this.newFloor)) {
      this.floors.push(this.newFloor);
      this.selectedFloor = this.newFloor;
      this.newFloor = null;
      this.errorMessage = '';
      this.closeAddFloorModal();
      if (this.isDetail === true) {
        this.openTableDetails();
      } else {
        this.openManageTablesModal();
      }
    } else {
      this.errorMessage = 'Khu vực đã tồn tại!';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
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
    this.isDetail = false;
  }
  openAddFloorModal() {
    this.closeTableDetailsModal();
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
    console.log(this.isDetail);

    if (this.isDetail === true) {
      this.openTableDetails();
    } else {
      this.openManageTablesModal();
    }
  }

  closeManageTablesModal() {
    const modal = this.manageTablesModal.nativeElement;
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
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
    if (this.capacity < 1) {
      this.capacityError = 'Số chỗ ngồi không hợp lệ.';
    } else {
      this.capacityError = null;
    }
  }
  showTableDetails(table: any): void {
    this.getTableById(table.tableId);
    this.isDetail = true;
    console.log(this.isDetail);

  }
  statusValid: number | undefined;
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
    if (this.statusValid === undefined) {
      this.statusValid = this.tableDetail?.status;
    }

  }

  closeTableDetailsModal(): void {
    const modal = this.tableDetailsModal.nativeElement;
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      this.removeExistingBackdrop();
    }
  }
  getTableById(id: number): void {
    this.tableService.getTablesById(id).subscribe(
      response => {
        console.log(response);
        this.tableDetail = response;
        this.selectedFloor = this.tableDetail.floor;
        this.newTable = this.tableDetail.lable;
        this.capacity = this.tableDetail.capacity;
        this.openTableDetails();
      },
      error => {
        console.error('Error khi thêm bàn:', error);
      }
    );
  }

  deleteTable(table: any): void {
    this.tableToDelete = table;
    this.openConfirmDeleteModal();
  }

  openConfirmDeleteModal(): void {
    this.isTableDetailsVisible = true;
    this.closeTableDetailsModal();

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
      if (this.isTableDetailsVisible) {
        this.openTableDetails();
        this.isTableDetailsVisible = false;
      }
    }
  }

  confirmDeleteTable(): void {
    if (this.tableToDelete) {
      this.tableService.deleteTable(this.tableToDelete.tableId).subscribe(
        () => {
          console.log('Bàn đã được xóa thành công!');
          this.getTableData();
          this.closeConfirmDeleteModal();
          this.closeTableDetailsModal();
          window.location.reload();
        },
        error => {
          console.error('Error deleting table:', error);
          this.openTableDetails();
        }
      );
    }
  }
  get tableStatus(): number {
    return this.tableDetail.status === 0 || this.tableDetail.status === 1 ? 1 : 2;
  }

  set tableStatus(value: any) {
    if (value === 1) {
      this.tableDetail.status = 0;
    } else {
      this.tableDetail.status = 2;
    }
  }
  messageUpdateValid: string = '';
  editTable(table: any): void {
    this.validateTableName();
    this.validateFloor();
    if (this.isTableNameInvalid || this.isFloorInvalid || this.capacity < 1) {
      console.error('Tên phòng/bàn không được để trống');
      return;
    }
    if (table.lable !== this.newTable || table.floor !== this.selectedFloor || table.capacity !== this.capacity || table.status !== this.statusValid) {
      this.tableToEdit = table;
      this.openConfirmEditModal();
    } else {
      this.messageUpdateValid = 'Không có chỉnh sửa gì ở trên';
      setTimeout(() => {
        this.messageUpdateValid = '';
      }, 3000);
    }
  }

  openConfirmEditModal(): void {
    this.isTableDetailsVisible = true;
    this.closeTableDetailsModal();

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

      if (this.isTableDetailsVisible) {
        this.openTableDetails();
        this.isTableDetailsVisible = false;
      }
    }
  }

  confirmEditTable(tableDetail: any): void {
    if (this.tableToEdit) {
      this.updateTable(tableDetail);
    }
  }
  validateTableName() {
    this.isTableNameInvalid = !this.newTable || this.newTable.trim() === '';
  }
  validateFloor() {
    this.isFloorInvalid = this.selectedFloor === null;
  }

  updateTable(tableDetail: any): void {
    const request = {
      status: tableDetail.status,
      capacity: this.capacity,
      floor: this.selectedFloor,
      lable: this.newTable
    }
    this.tableService.updateTable(this.tableDetail.tableId, request).subscribe(
      response => {
        const index = this.originalDataTable.findIndex(table => table.tableId === this.tableDetail.tableId);
        if (index !== -1) {
          this.originalDataTable[index] = response;
          this.dataTable[index] = response;
        }
        this.closeTableDetailsModal();
        window.location.reload();
      },
      error => {
        console.error('Error updating table:', error);
      }
    );
  }
  getWaitingTable() {
    this.tableService.getTablesEmpty().subscribe(
      response => {
        this.waitingTables = response;
        console.log(this.waitingTables);

        this.isWaitingTableView = true;
      },
      error => {
        console.error('Error updating table:', error);
      }
    );
  }

  openEditFloorModal(): void {
    const modal = this.editFloorModal.nativeElement;
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }

  closeEditFloorModal(): void {
    const modal = this.editFloorModal.nativeElement;
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      this.removeExistingBackdrop();
    }
    this.isEditing = false;
    this.newSelectedFloor = '';
  }

  toggleEdit(): void {
    console.log(this.selectedFloor);
    if (this.isEditing) {
      this.saveChanges();
    } else {
      this.isEditing = true;
      this.newSelectedFloor = this.selectedFloor;
    }
  }

  saveChanges(): void {
    if (this.newSelectedFloor !== null && this.newSelectedFloor !== this.selectedFloor) {
      const body = {
        currentFloor: this.selectedFloor,
        newFloor: this.newSelectedFloor
      }
      this.tableService.updateFloor(body).subscribe(
        response => {
          console.log(response);
          window.location.reload();
        },
        error => {
          console.error('Error updating table:', error);
        }
      );
      this.selectedFloor = this.newSelectedFloor;
    } else {
      console.log('Không có thay đổi tầng');
    }
    this.isEditing = false;
  }

  // Hàm xóa tầng
  confirmDeleteFloor(): void {
    const body = {
      currentFloor: this.selectedFloor,
      newFloor: 0
    }
    this.tableService.updateFloor(body).subscribe(
      response => {
        console.log(response);
        window.location.reload();
      },
      error => {
        console.error('Error updating table:', error);
      }
    );
  }
  getAvailableFloors(): string[] {
    return this.floors.filter(floor => floor !== this.selectedFloor);
  }
  deleteFloor(): void {
    this.openConfirmDeleteFloorModal();
  }

  openConfirmDeleteFloorModal(): void {
    this.closeEditFloorModal();

    const modal = this.confirmDeleteFloorModal.nativeElement;
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    }
  }
  closeConfirmDeleteFloorModal(): void {
    const modal = this.confirmDeleteFloorModal.nativeElement;
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      this.removeExistingBackdrop();
    }
    this.openEditFloorModal();
  }
}
