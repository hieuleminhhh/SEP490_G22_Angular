import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


@Component({
  selector: 'app-NoteDialog',
  templateUrl: './NoteDialog.component.html',
  styleUrls: ['./NoteDialog.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule]
})
export class NoteDialogComponent implements OnInit {

  note: string;

  constructor(
    public dialogRef: MatDialogRef<NoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.note = data.note;
  }

  ngOnInit() { }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.note);
  }

}
