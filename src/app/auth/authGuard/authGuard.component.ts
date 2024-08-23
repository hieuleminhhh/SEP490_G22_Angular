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
      if (url === 'listTable' && (user.role === 'Cashier' || user.role === 'OrderStaff')) {
        return true;
    }
      if (url === 'manageNew' && user.role === 'Cashier') {
        return true; 
      }
      if (url === 'managerorder' && user.role === 'Cashier') {
        return true; 
      }
      if (url === 'managerorder' && user.role === 'Cashier') {
        return true; 
      }
      if (url === 'createOffline' && user.role === 'Cashier' || user.role === 'OrderStaff') {
        return true; 
      }
      if (url === 'updateOffline' && user.role === 'Cashier' || user.role === 'OrderStaff') {
        return true; 
      }
      if (url === 'updateOffline' && user.role === 'Cashier' || user.role === 'OrderStaff') {
        return true; 
      }
      if (url === 'createTakeaway' && user.role === 'Cashier') {
        return true; 
      }
      if (url === 'createOnline' && user.role === 'Cashier') {
        return true; 
      }
      if (url === 'manageDiscount' && user.role === 'Manager') {
        return true; 
      } 
      if (url === 'managerdish' && user.role === 'Manager') {
        return true; 
      } 
      if (url === 'managercombo' && user.role === 'Manager') {
        return true; 
      } 
    }
    this.router.navigate(['/login']); 
    return false;
  }
}
