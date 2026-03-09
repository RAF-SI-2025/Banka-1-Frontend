import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./components/reset-password/reset-password').then(m => m.ResetPassword)
  },
  {
    path: 'activate-account',
    loadComponent: () => import('./components/activate-account/activate-account').then(m => m.ActivateAccount)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
