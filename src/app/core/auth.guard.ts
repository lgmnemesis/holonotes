import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService,
    private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {
      const notLoggedInAuth = next.data && next.data.not_logged_in;
      const notGuestLoggedInAuth = next.data && next.data.not_guest_logged_in;
      return this.canLogin(notLoggedInAuth, notGuestLoggedInAuth);
  }

  async canLogin(notLoggedInAuth: any, notGuestLoggedInAuth: any) {
    const isAnonymousLoggedIn = await this.auth.isAnonymousLoggedIn();
    const isLoggedIn = await this.auth.isLoggedIn();
    if (notLoggedInAuth && this.auth.isSubscribe && !this.auth.isLoggedIn()) {
      return true;
    } else if (notGuestLoggedInAuth &&
      this.auth.isSubscribe && !isAnonymousLoggedIn) {
      return true;
    } else if (isLoggedIn) {
      return true;
    }
    this.router.navigate(['/']);
    return false;
  }
}
