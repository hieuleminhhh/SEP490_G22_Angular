import { Component, OnInit } from '@angular/core';
import { CreateAccountDTO, GetAccountDTO, UpdateAccountDTO } from '../../../models/account.model';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../../service/account.service';
import { Observable, window } from 'rxjs';
import { SidebarAdminComponent } from "../SidebarAdmin/SidebarAdmin.component";
import { HeaderOrderStaffComponent } from "../../staff/ManagerOrder/HeaderOrderStaff/HeaderOrderStaff.component";

@Component({
  selector: 'app-manageAccount',
  templateUrl: './manageAccount.component.html',
  styleUrls: ['./manageAccount.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarAdminComponent, HeaderOrderStaffComponent, ReactiveFormsModule ]
})
export class ManageAccountComponent implements OnInit {

  constructor(private accountService: AccountService,private fb: FormBuilder) { }
  accounts: GetAccountDTO[] = [];
  selectedAccount: GetAccountDTO | null = null;
  isEditing: boolean = false;
  errorMessage: string = '';
  accountForm!: FormGroup;
  showPasswordMap: { [key: number]: boolean } = {};

  currentPage = 1; // Trang hiện tại
  itemsPerPage = 5; // Số bản ghi trên mỗi trang
  totalItems = 0; // Tổng số bản ghi

  ngOnInit() {
    this.accountForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: ['', Validators.required],
      password: ['', Validators.required],
      role: ['', Validators.required],
      address: [''],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      isActive: [true]
    });
    this.loadAccounts();
  }

  loadAccounts() {
    this.accountService.getAllAccounts().subscribe(
      accounts => {
        this.accounts = accounts;
        console.log('25', this.accounts); // Log here after accounts are populated
        this.totalItems = this.accounts.length;
        this.paginateData();
      },
      error => this.errorMessage = 'Error fetching accounts.'
    );


    console.log(this.totalItems);
  }


  getAccountById(id: number) {
    this.accountService.getAccountById(id).subscribe(
      account => this.selectedAccount = account,
      error => this.errorMessage = 'Error fetching account details.'
    );
  }
  suscessM: any;
  errorMessages: any = {};
  createAccount(accountDTO: any) {
    this.accountService.createAccount(accountDTO).subscribe(
      newAccount => {
        console.log('Account created successfully', newAccount);
        this.suscessM = ('Tạo tài khoản thành công');
        globalThis.window.location.reload();
      },
      error => {
        this.errorMessages.general = 'Tạo tài khoản không thành công. Hãy thử lại.';
        console.error('Error creating account', error);

        // Clear the error message after 2 seconds
        setTimeout(() => {
          this.errorMessages.general = '';
        }, 2000);
      }
    );
  }
  updateAccount(id: number, accountDTO: UpdateAccountDTO) {
    this.accountService.updateAccount(id, accountDTO).subscribe(
      updatedAccount => {
        this.loadAccounts();
        this.selectedAccount = null;
        this.errorMessages.general = 'Tạo tài khoản không thành công. Hãy thử lại.';
      },
      error => this.errorMessage = 'Error updating account.'
    );
  }

  selectAccount(account: GetAccountDTO) {
    this.selectedAccount = account;
    this.isEditing = true;
  }

  togglePasswordVisibility(index: number): void {
    this.showPasswordMap[index] = !this.showPasswordMap[index];
  }

  toggleActiveStatus(account: GetAccountDTO): void {
    const newStatus = !account.isActive;
    account.isActive = newStatus;

    // Update the status on the server
    this.updateAccountStatus(account.accountId, newStatus);
  }

  updateAccountStatus(id: number, isActive: boolean): void {
    if (!id) {
      console.error('Account ID is missing');
      return;
    }

    this.accountService.updateAccountStatus(id, isActive).subscribe(
      response => {
        console.log('Response:', response);
        alert(`Cập nhập trạng thái thành công: ${isActive ? 'Đang hoạt động' : 'Không hoạt động'}`);
        globalThis.window.location.reload();
      },
      error => {
        this.errorMessage = 'Error updating account status.';
        console.error('Error updating account status:', error);

        // Optionally revert the change if the update fails
        const account = this.accounts.find(acc => acc.accountId === id);
        if (account) {
          account.isActive = !isActive;
        }
      }
    );
  }
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAccounts();
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadAccounts();
    }
  }

  paginateData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    if (this.accounts) {
      this.accounts = this.accounts.slice(startIndex, endIndex);
    }
  }
  goToDesiredPage(): void {
    if (this.currentPage >= 1 && this.currentPage <= this.totalPages) {
      this.loadAccounts();
    } else {
      // Xử lý thông báo lỗi nếu số trang nhập không hợp lệ
      console.log('Invalid page number');
    }
  }
  onSubmit() {
    if (this.accountForm.valid) {
      this.createAccount(this.accountForm.value);
    } else {
      // Handle form validation errors
      console.log('Form is invalid');
    }
  }
  selectedRole: string = '';
  openUpdateRoleModal(account: GetAccountDTO) {
    this.selectedAccount = account;
    this.selectedRole = account.role; // Pre-select the current role
  }
  saveRoleChange() {
    if (this.selectedAccount) {
      this.accountService.updateAccountRole(this.selectedAccount.accountId, this.selectedRole).subscribe(
        response => {
          console.log('Role updated successfully', response);
          globalThis.window.location.reload();
        },
        error => {
          console.error('Error updating role', error);
        }
      );
    }
  }
}
