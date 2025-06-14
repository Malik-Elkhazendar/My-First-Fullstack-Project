import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Check if the user is authenticated
    if (this.authService.isAuthenticated) {
      // Check if the route requires admin role
      if (route.data['roles'] && route.data['roles'].includes('admin') && !this.authService.isAdmin) {
        // Redirect to unauthorized page or home
        return this.router.createUrlTree(['/unauthorized']);
      }
      
      return true;
    }
    
    // Store the attempted URL for redirecting after login
    return this.router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
} 