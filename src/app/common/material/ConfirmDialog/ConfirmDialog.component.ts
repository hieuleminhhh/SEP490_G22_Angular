import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ConfirmDialog',
  templateUrl: './ConfirmDialog.component.html',
  styleUrls: ['./ConfirmDialog.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule]
})
export class ConfirmDialogComponent {
  constructor(
    private router: Router,
    public dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) { }

  onConfirm(): void {
    this.dialogRef.close(true);
    this.router.navigate(['/listTable']);
  }
}
