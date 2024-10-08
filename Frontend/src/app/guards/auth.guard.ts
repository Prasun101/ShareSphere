import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.hasToken()) {
      this.router.navigate(['/home']); // Redirect to home if user is logged in
      return false;
    }
    return true; // Allow access if user is not logged in
  }
}
