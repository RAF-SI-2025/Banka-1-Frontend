import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Guard koji proverava da li je korisnik autentifikovan.
 * Ukoliko korisnik nije ulogovan, preusmerava ga na /auth/login stranicu.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('authToken');

  if (!token) {
    router.navigate(['/auth/login']);
    return false;
  }

  return true;
};
