import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Uvozimo tvoju komponentu i gvarda
import { EmployeeListComponent } from './features/employee/components/employee-list/employee-list.component';
import { authGuard } from './core/guards/auth.guard'; 

const routes: Routes = [
  // 1. KOLEGINA RUTA ZA LOGIN (Koristimo njegov loadComponent sistem)
  // {
  //   path: 'login',
  //   loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  // },

  // 2. TVOJA RUTA ZA TABELU (Zaštićena gvardom)
  { 
    path: 'employees', 
    component: EmployeeListComponent,
    canActivate: [authGuard] 
  },

  // 3. POČETNA STRANA (Sada prvo pokušava da te pošalje na tabelu)
  { path: '', redirectTo: '/employees', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }