import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [CommonModule, IonicModule], 
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ManageRestaurant';
}
