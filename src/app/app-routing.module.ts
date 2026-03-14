import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EmployeeListComponent } from './features/employee/components/employee-list/employee-list.component';
import { EmployeeCreateComponent } from './features/employee/components/employee-create/employee-create.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { ForbiddenComponent } from './shared/components/forbidden/forbidden.component';

const routes: Routes = [
  {
    path: 'employees/new',
    component: EmployeeCreateComponent,
    canActivate: [authGuard, roleGuard],
    data: { permission: 'EMPLOYEE_MANAGE_ALL' }
  },
  {
    path: 'employees',
    component: EmployeeListComponent,
    canActivate: [authGuard, roleGuard],
    data: { permission: 'EMPLOYEE_MANAGE_ALL' }
  },
  {
    path: '403',
    component: ForbiddenComponent
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule)
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
