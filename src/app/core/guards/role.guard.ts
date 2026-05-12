import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';

/**
 * Guard koji proverava da li ulogovani korisnik ima potrebnu permisiju za pristup ruti.
 * Permisije se čitaju direktno iz localStorage, ili se određuju na osnovu role korisnika.
 * Ukoliko korisnik nema odgovarajuću permisiju, preusmerava ga na /403 stranicu.
 * @param route - Aktivna ruta koja sadrži podatak o potrebnoj permisiji (data.permission)
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const user = localStorage.getItem('loggedUser');

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  const parsedUser: { email: string; role: string; permissions: string[] } = JSON.parse(user);
  const requiredPermission: string | undefined = route.data['permission'];
  const anyPermission: string[] | undefined = route.data['anyPermission'];
  const anyRole: string[] | undefined = route.data['anyRole'];

  if (!requiredPermission && !anyPermission?.length && !anyRole?.length) return true;

  const userPermissions = parsedUser.permissions ?? [];

  const userRoleUpper = (parsedUser.role ?? '').toUpperCase();
  const roleMatch = !!anyRole?.some((r) => r.toUpperCase() === userRoleUpper);
  const permMatch = anyPermission?.length
    ? anyPermission.some((p) => userPermissions.includes(p))
    : false;

  // anyRole/anyPermission rade OR-om: ako je makar jedno zadovoljeno, propusti.
  if ((anyRole?.length || anyPermission?.length) && !roleMatch && !permMatch) {
    router.navigate(['/403']);
    return false;
  }

  if (requiredPermission && !userPermissions.includes(requiredPermission)) {
    router.navigate(['/403']);
    return false;
  }

  const allowedRoles = route.data['allowedRoles'] as string[] | undefined;
  if (allowedRoles?.length) {
    const roleNorm = (parsedUser.role ?? '').trim().toLowerCase();
    const ok = allowedRoles.some(
      (r) => r.trim().toLowerCase() === roleNorm,
    );
    if (!ok) {
      router.navigate(['/403']);
      return false;
    }
  }

  return true;
};
