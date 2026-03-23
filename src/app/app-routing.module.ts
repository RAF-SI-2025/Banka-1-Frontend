import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EmployeeListComponent } from './features/employee/components/employee-list/employee-list.component';
import { EmployeeCreateComponent } from './features/employee/components/employee-create/employee-create.component';
import { AccountCreateComponent } from './features/client/components/account-create/account-create.component';
import { ClientListComponent } from './features/client/components/client-list/client-list.component';
import { ClientDetailComponent } from './features/client/components/client-detail/client-detail.component';
import { AccountListComponent } from './features/client/components/account-list/account-list.component';
import { TransferDiffComponent } from './features/client/components/transfer-diff/transfer-diff.component';
import { TransferSameComponent } from './features/client/components/transfer-same/transfer-same.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { ForbiddenComponent } from './shared/components/forbidden/forbidden.component';
import { NewPaymentComponent } from './features/client/components/new-payment/new-payment.component';
import { AccountManagementComponent } from './features/employee/account-management/account-management.component';
import { AccountCardsPlaceholderComponent } from './features/employee/account-cards-placeholder/account-cards-placeholder.component';
import { PaymentRecipientsComponent } from './features/client/components/payment-recipients/payment-recipients.component';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () =>
      import('./features/client/client.module').then((m) => m.ClientModule),
    canActivate: [authGuard]
  },
  {
    path: 'employees/new',
    component: EmployeeCreateComponent,
    canActivate: [authGuard, roleGuard],
    data: { permission: 'EMPLOYEE_MANAGE_ALL' }
  },
  {
    path: 'accounts/new',
    component: AccountCreateComponent,
    canActivate: [authGuard, roleGuard],
    data: { permission: 'CLIENT_MANAGE' }
  },
  {
    path: 'clients',
    component: ClientListComponent,
    canActivate: [authGuard, roleGuard],
    data: { permission: 'CLIENT_MANAGE' }
  },
  {
    path: 'clients/:id',
    component: ClientDetailComponent,
    canActivate: [authGuard, roleGuard],
    data: { permission: 'CLIENT_MANAGE' }
  },
  {
    path: 'users',
    loadChildren: () => import('./features/user/user.module').then((m) => m.UserModule)
  },
  {
    path: 'employees',
    component: EmployeeListComponent,
    canActivate: [authGuard, roleGuard],
    data: { permission: 'EMPLOYEE_MANAGE_ALL' }
  },
  {
    path: 'accounts/payment/new',
    component: NewPaymentComponent,
    canActivate: [authGuard]
  },
  {
    path: 'accounts',
    component: AccountListComponent,
    canActivate: [authGuard],
  },
  {
  path: 'account-management',
  component: AccountManagementComponent,
  canActivate: [authGuard, roleGuard],
  data: { permission: 'CLIENT_MANAGE' }
},
{
  path: 'account-cards',
  component: AccountCardsPlaceholderComponent,
  canActivate: [authGuard, roleGuard],
  data: { permission: 'CLIENT_MANAGE' }
},

  {
  path: 'transfers/different',
  component: TransferDiffComponent,
  canActivate: [authGuard]
  },

  {
  path: 'transfers/same',
  component: TransferSameComponent,
  canActivate: [authGuard]
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
    path: 'payments/recipients',
    component: PaymentRecipientsComponent,
    canActivate: [authGuard]
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
