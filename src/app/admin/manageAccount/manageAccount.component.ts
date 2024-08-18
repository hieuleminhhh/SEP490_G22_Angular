import { Component, OnInit } from '@angular/core';
import { CreateAccountDTO, GetAccountDTO, UpdateAccountDTO } from '../../../models/account.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../../service/account.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-manageAccount',
  templateUrl: './manageAccount.component.html',
  styleUrls: ['./manageAccount.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ManageAccountComponent implements OnInit {

  constructor(private accountService: AccountService) { }
  accounts: GetAccountDTO[] = [];
  selectedAccount: GetAccountDTO | null = null;
  isEditing: boolean = false;
  errorMessage: string = '';
  showPasswordMap: { [key: number]: boolean } = {};
  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.accountService.getAllAccounts().subscribe(
      accounts => this.accounts = accounts,
      error => this.errorMessage = 'Error fetching accounts.'
    );
  }

  getAccountById(id: number) {
    this.accountService.getAccountById(id).subscribe(
      account => this.selectedAccount = account,
      error => this.errorMessage = 'Error fetching account details.'
    );
  }

  createAccount(accountDTO: CreateAccountDTO) {
    this.accountService.createAccount(accountDTO).subscribe(
      newAccount => {
        this.loadAccounts();
        this.selectedAccount = null;
        alert('Account created successfully.');
      },
      error => this.errorMessage = 'Error creating account.'
    );
  }

  updateAccount(id: number, accountDTO: UpdateAccountDTO) {
    this.accountService.updateAccount(id, accountDTO).subscribe(
      updatedAccount => {
        this.loadAccounts();
        this.selectedAccount = null;
        alert('Account updated successfully.');
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
    // Toggle the account's active status
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
        alert(`Account status updated to: ${isActive ? 'Đang hoạt động' : 'Không hoạt động'}`);
      },
      error => {
        this.errorMessage = 'Error updating account status.';
        console.error('Error updating account status:', error);
  
        // Optionally revert the change if the update fails
        const account = this.accounts.find(acc => acc.accountId === id);
        if (account) {
          account.isActive = !isActive; // Revert to original status
        }
      }
    );
  }
  
  
  
}
