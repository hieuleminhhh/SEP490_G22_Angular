import { Component, OnInit } from '@angular/core';
import { TableService } from '../../../../service/table.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarOrderComponent } from "../../SidebarOrder/SidebarOrder.component";

@Component({
    selector: 'app-ViewTableOrder',
    templateUrl: './ViewTableOrder.component.html',
    styleUrls: ['./ViewTableOrder.component.css'],
    standalone: true,
    imports: [RouterModule, CommonModule, FormsModule, SidebarOrderComponent]
})
export class ViewTableOrderComponent implements OnInit {
  tables: any[] = [];
  originalDataTable: any[] = [];
  currentView: string = 'table-layout';
  selectedFloor = 1;
  selectedTable: string = 'all';
  dataTable: any;
  constructor(private tableService: TableService, private router: Router) { }

  ngOnInit() {
    this.getTableData();
  }
  getTableData(): void {
    this.tableService.getTables().subscribe(
      response => {
        this.originalDataTable = response; // Lưu dữ liệu ban đầu
        this.dataTable = [...this.originalDataTable];
        this.filterTablesByFloorAndStatus(this.selectedTable);
      },
      error => {
        console.error('Error:', error);
      }
    );
  }
  getFloors(): number[] {
    const uniqueFloors = new Set<number>();
    this.originalDataTable.forEach(table => {
      uniqueFloors.add(table.floor);
    });
    return Array.from(uniqueFloors).sort((a, b) => a - b);
  }
  getTableOFFloor(floor: number) {
    this.selectedFloor = floor;
    this.filterTablesByFloorAndStatus(this.selectedTable);
  }

  getTableOFFloorEmpty(floor: any): void {
    this.selectedFloor = parseInt(floor, 10);
    this.dataTable = this.originalDataTable.filter(table => table.floor === this.selectedFloor && table.status === 0);
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
  navigateToCreateOfflineOrder(tableId: number): void {
    this.router.navigate(['/createOffline'], { queryParams: { tableId } });
  }

}
