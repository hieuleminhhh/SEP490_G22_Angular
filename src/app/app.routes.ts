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
import { PaymentReservationComponent } from './common/paymentReservation/paymentReservation.component';
import { CreateOnlineOrderComponent } from './staff/ManagerOrder/CreateOnlineOrder/CreateOnlineOrder.component';
import { CreateTakeAwayOrderComponent } from './staff/ManagerOrder/CreateTakeAwayOrder/CreateTakeAwayOrder.component';
import { CookingManagementComponent } from './chef/cooking-management/cooking-management.component';
import { ViewTableOrderComponent } from './staff/ManagerOrder/ViewTableOrder/ViewTableOrder.component';
import { CreateOfflineOrderComponent } from './staff/ManagerOrder/CreateOfflineOrder/CreateOfflineOrder.component';
import { UpdateOfflineOrderComponent } from './staff/ManagerOrder/UpdateOfflineOrder/UpdateOfflineOrder.component';
import { PaymentSuccessComponent } from './common/payment-success/payment-success.component';
import { ManageDiscountComponent } from './manager/ManageDiscount/ManageDiscount.component';
import { FillDishComponent } from './staff/fill-dish/fill-dish.component';
import { UpdateOrderForGuestComponent } from './staff/ManagerOrder/UpdateOrderForGuest/UpdateOrderForGuest.component';
import { SettingComponent } from './admin/setting/setting.component';
import { ManageAccountComponent } from './admin/manageAccount/manageAccount.component';


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
    {'path': 'paymentReservation', component:PaymentReservationComponent},
    {'path': 'createTakeaway', component:CreateTakeAwayOrderComponent},
    {'path': 'createOnline', component:CreateOnlineOrderComponent},
    {'path': 'cooking', component:CookingManagementComponent},
    {'path': 'listTable', component:ViewTableOrderComponent},
    {'path': 'createOffline', component:CreateOfflineOrderComponent},
    {'path': 'updateOffline' , component:UpdateOfflineOrderComponent},
    {'path': 'paymentSuccess' , component:PaymentSuccessComponent},
    {'path': 'manageDiscount' , component:ManageDiscountComponent},
    {'path': 'fillDish' , component:FillDishComponent},
    {'path': 'manageDiscount' , component:ManageDiscountComponent},
    {'path': 'updateOrder/:orderId' , component: UpdateOrderForGuestComponent},
    {'path': 'setting' , component: SettingComponent},
    {'path': 'manageAccount', component: ManageAccountComponent},
];
