// src/app/app.component.ts
import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HomeComponent } from './home/home.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, IonicModule, HomeComponent, RouterOutlet], 
})
export class AppComponent {
  title = 'ManageRestaurant';
}
