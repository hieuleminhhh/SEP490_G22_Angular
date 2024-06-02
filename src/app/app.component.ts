// src/app/app.component.ts
import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './common/navbar/navbar.component';
import { FooterComponent } from './common/footer/footer.component';
import { CartService } from '../service/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
<<<<<<< HEAD
  imports: [CommonModule, IonicModule, HomeComponent, RouterOutlet], 
=======
  imports: [CommonModule, IonicModule, NavbarComponent,FooterComponent, RouterOutlet],
  providers: [CartService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
>>>>>>> 4d976e8ebf5b67e9532910d8aed84671ebd0d2ae
})
export class AppComponent {
  title = 'ManageRestaurant';
}
