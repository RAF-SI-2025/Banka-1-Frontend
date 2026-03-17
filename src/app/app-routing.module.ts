import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Uvozimo komponente i gvarda
import { EmployeeListComponent } from './features/employee/components/employee-list/employee-list.component';
import { EmployeeCreateComponent } from './features/employee/components/employee-create/employee-create.component';
import { AccountCreateComponent } from './features/employee/components/account-create/account-create.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const routes: Routes = [
  // 1. RUTA ZA LOGIN (Otkomenatarisana da Guard ne bi bacao "Cannot match any routes" grešku)
  // {
  //   path: 'login',
  //   loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  // },

  // 2. NOVA RUTA ZA KREIRANJE ZAPOSLENOG (Zaštićena gvardom)
  // Važno: Rute sa dodacima (poput /new) je dobra praksa staviti IZNAD osnovne rute (/employees)
  {
    path: 'employees/new',
    component: EmployeeCreateComponent,
    canActivate: [authGuard, roleGuard],
    data: { permission: 'EMPLOYEE_MANAGE_ALL' }
  },

  // RUTA ZA KREIRANJE RAČUNA (F7 - Zaposleni)
  {
    path: 'employees/accounts/new',
    component: AccountCreateComponent,
    canActivate: [authGuard, roleGuard],
    data: { permission: 'CLIENT_MANAGE' }
  },
  {
    path: 'users',
    loadChildren: () => import('./features/user/user.module').then((m) => m.UserModule)
  },

  // 3. RUTA ZA TABELU (Zaštićena gvardom)
  {
    path: 'employees',
    component: EmployeeListComponent,
    canActivate: [authGuard, roleGuard],
    data: { permission: 'EMPLOYEE_MANAGE_ALL' }
  },

  // 4. POČETNA STRANA (Landing page)
  {
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
