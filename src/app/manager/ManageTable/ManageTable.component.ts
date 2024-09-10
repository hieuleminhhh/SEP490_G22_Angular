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
  newTable: string='';
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
        this.originalDataTable = response;
        this.dataTable = [...this.originalDataTable];
        this.filterTablesByFloorAndStatus(this.selectedTable);
        const tableIds = this.originalDataTable.map(table => table.tableId);

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
      this.dataTable = this.originalDataTable.filter(table => table.floor === currentFloor);
    } else if (selectedTable === 'empty') {
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
      this.capacityError = null;
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

  editTable(table: any): void {
    this.tableToEdit = table;
    this.openConfirmEditModal();
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

  confirmEditTable(tableDetail:any): void {
    if (this.tableToEdit) {
      this.updateTable(tableDetail);
    }
  }

  updateTable(tableDetail: any): void {
    const request = {
      status: tableDetail.status,
      capacity: tableDetail.capacity,
      floor: tableDetail.floor
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
  getWaitingTable(){

  }

}
