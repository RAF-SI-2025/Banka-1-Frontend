import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const loggedInGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('authToken');

  if (token) {
    const user = localStorage.getItem('loggedUser');
    if (user) {
      const parsed = JSON.parse(user);
      const perms: string[] = parsed.permissions || [];
      if (perms.includes('EMPLOYEE_MANAGE_ALL')) {
        router.navigate(['/employees']);
      } else {
        router.navigate(['/clients']);
      }
    } else {
      router.navigate(['/clients']);
    }
    return false;
  }

  return true;
};
