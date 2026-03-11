import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';

/**
 * Guard koji proverava da li ulogovani korisnik ima potrebnu permisiju za pristup ruti.
 * Ukoliko korisnik nema odgovarajucu permisiju, preusmerava ga na /403 stranicu.
 * @param route - Aktivna ruta koja sadrzi podatak o potrebnoj permisiji (data.permission)
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const user = localStorage.getItem('loggedUser');

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const parsedUser: { email: string; permissions: string[] } = JSON.parse(user);
  const requiredPermission: string = route.data['permission'];

  if (!parsedUser.permissions.includes(requiredPermission)) {
    router.navigate(['/403']);
    return false;
  }

  return true;
};
