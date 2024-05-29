import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MenuComponent } from './menu/menu.component';
import { NewsComponent } from './news/news.component';
import { BookingComponent } from './booking/booking.component';
import { OrderComponent } from './order/order.component';

export const routes: Routes = [
    {'path': '', component:HomeComponent},
    {'path': 'menu', component:MenuComponent},
    {'path': 'news', component:NewsComponent},
    {'path': 'booking', component:BookingComponent},
    {'path': 'order', component:OrderComponent}
];
