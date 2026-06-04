import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard koji proverava da li je korisnik autentifikovan i da li mu token nije istekao.
 * Ukoliko token ne postoji ili je istekao, odjavljuje korisnika i preusmerava na /login.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  if (!authService.isAuthenticated()) {
    authService.logout();
    return false;
  }

  return true;
};
