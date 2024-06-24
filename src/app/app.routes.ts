import { Routes } from '@angular/router';
import { HomeComponent } from './common/home/home.component';
import { MenuComponent } from './common/menu/menu.component';
import { NewsComponent } from './common/news/news.component';
import { BookingComponent } from './common/booking/booking.component';
import { CartComponent } from './common/cart/cart.component';
import { DashboardComponent } from './staff/dashboard/dashboard.component';
import { PaymentComponent } from './common/payment/payment.component';
import { LoginComponent } from './common/login/login.component';
import { DashboardManagerComponent } from './manager/DashboardManager/DashboardManager.component';
import { ManagerDishComponent } from './manager/ManagerDish/ManagerDish.component';
import { ManagerComboComponent } from './manager/ManagerCombo/ManagerCombo.component';
import { PurchaseOrderComponent } from './common/purchaseOrder/purchaseOrder.component';
import { CheckoutComponent } from './common/checkout/checkout.component';
import { OrderDetailComponent } from './common/orderDetail/orderDetail.component';
import { TableManagementComponent } from './staff/tableManagement/tableManagement.component';
import { ManagerOrderComponent } from './staff/ManagerOrder/ManagerOrder.component';
import { CreateUpdateOrderComponent } from './staff/ManagerOrder/CreateUpdateOrder/CreateUpdateOrder.component';
import { TableManagementComponent } from './staff/tableManagement/tableManagement.component';

export const routes: Routes = [
    {'path': '', component:HomeComponent},
    {'path': 'login', component:LoginComponent},
    {'path': 'menu', component:MenuComponent},
    {'path': 'news', component:NewsComponent},
    {'path': 'booking', component:BookingComponent},
    {'path': 'cart', component:CartComponent},
    {'path': 'dashboard', component:DashboardComponent},
    {'path': 'payment', component:PaymentComponent},
    {'path': 'manager', component:DashboardManagerComponent},
    {'path': 'managerdish', component:ManagerDishComponent},
    {'path': 'managercombo', component:ManagerComboComponent},
    {'path': 'purchase', component:PurchaseOrderComponent},
    {'path': 'checkout', component:CheckoutComponent},
    {'path': 'orderDetail', component:OrderDetailComponent},
    {'path': 'tableManagement', component:TableManagementComponent},
    {'path': 'managerorder', component:ManagerOrderComponent},
    {'path': 'cuorder', component:CreateUpdateOrderComponent},
    {'path': 'tableManagement', component:TableManagementComponent},
];
