import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const loggedInGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('authToken');

  if (token) {
    router.navigate(['/employees']);
    return false;
  }

  return true;
};
