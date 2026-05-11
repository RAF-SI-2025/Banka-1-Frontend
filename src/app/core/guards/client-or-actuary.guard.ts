import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard koji proverava da li je korisnik klijent ili aktuvar.
 * Dozvoljava pristup samo klijentima i aktuarima.
 */
export const clientOrActuaryGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isClient() || authService.isActuary()) {
    return true;
  }

  // Ako korisnik nije klijent niti aktuvar, preusmerava ga na forbidden stranicu
  router.navigate(['/403']);
  return false;
};
