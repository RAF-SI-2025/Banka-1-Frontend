import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'activate',
    loadComponent: () => import('./features/auth/activate/activate.component').then(m => m.ActivateComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { permission: 'ADMIN' },
    children: [
      {
        path: 'employees',
        loadComponent: () => import('./features/admin/employee-list/employee-list.component').then(m => m.EmployeeListComponent)
      },
      {
        path: 'employees/new',
        loadComponent: () => import('./features/admin/employee-create/employee-create.component').then(m => m.EmployeeCreateComponent)
      },
      {
        path: 'employees/:id/edit',
        loadComponent: () => import('./features/admin/employee-edit/employee-edit.component').then(m => m.EmployeeEditComponent)
      }
    ]
  },
  {
    path: '403',
    loadComponent: () => import('./features/errors/forbidden/forbidden.component').then(m => m.ForbiddenComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
