import { Routes } from '@angular/router';
import { HomeComponent } from './common/home/home.component';
import { MenuComponent } from './common/menu/menu.component';
import { NewsComponent } from './common/news/news.component';
import { BookingComponent } from './common/booking/booking.component';
import { CartComponent } from './common/cart/cart.component';
import { DashboardComponent } from './staff/dashboard/dashboard.component';
import { PaymentComponent } from './common/payment/payment.component';

export const routes: Routes = [
    {'path': '', component:HomeComponent},
    {'path': 'menu', component:MenuComponent},
    {'path': 'news', component:NewsComponent},
    {'path': 'booking', component:BookingComponent},
    {'path': 'cart', component:CartComponent},
    {'path': 'dashboard', component:DashboardComponent},
    {'path': 'payment', component:PaymentComponent}

];
