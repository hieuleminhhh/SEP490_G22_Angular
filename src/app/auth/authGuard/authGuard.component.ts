import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.getUser(); 
    const url = route.url[0].path; 

    if (user) {
      //Cashier, Order Staff
      if (url === 'listTable' && (user.role === 'Cashier' || user.role === 'OrderStaff')) {
        return true;
      }
      if (url === 'managerorder' && (user.role === 'Cashier'  || user.role === 'OrderStaff')) {
        return true; 
      }
      if (url === 'createTakeaway' && (user.role === 'Cashier' || user.role === 'OrderStaff')) {
        return true; 
      }
      //Cashier
      if (url === 'invoice' &&  (user.role === 'Cashier' || user.role === 'Manager')) {
        return true; 
      }
      //Order Staff
      if (url === 'createOffline' && user.role === 'OrderStaff') {
        return true; 
      }
      if (url === 'updateOffline' && user.role === 'OrderStaff') {
        return true; 
      }
      if (url === 'createOnline' && (user.role === 'Cashier' || user.role === 'OrderStaff')){
        return true; 
      }
      if (url === 'fillDish' && user.role === 'OrderStaff') {
        return true; 
      }
      if (url === 'tableManagement' && user.role === 'OrderStaff') {
        return true; 
      }
      //Manager
      if (url === 'manageDiscount' && user.role === 'Manager') {
        return true; 
      } 
      if (url === 'managerdish' && user.role === 'Manager') {
        return true; 
      } 
      if (url === 'managercombo' && user.role === 'Manager') {
        return true; 
      } 
      if (url === 'manageNew' && user.role === 'Manager') {
        return true; 
      }
      //Chef
      if (url === 'cooking' && user.role === 'Chef') {
        return true; 
      } 
      //Admin
      if (url === 'manageAccount' && user.role === 'Admin') {
        return true; 
      } 
      if (url === 'setting' && user.role === 'Admin') {
        return true; 
      } 
    }
    localStorage.removeItem('token');
    localStorage.removeItem('accountId');
    window.location.href = '/login';
    return false;
  }
}
