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
import { ExchangeListComponent } from './features/employee/components/exchange-list/exchange-list.component';
import { AccountManagementComponent } from './features/employee/account-management/account-management.component';
import { AccountCardsPlaceholderComponent } from './features/employee/account-cards-placeholder/account-cards-placeholder.component';
import { ActuaryManagementComponent } from './features/employee/components/actuary-management/actuary-management.component';
import { PaymentRecipientsComponent } from './features/client/components/payment-recipients/payment-recipients.component';
import { PaymentHistoryComponent } from './features/client/components/payment-history/payment-history.component';
import { SecuritiesListComponent } from './features/securities/components/securities-list/securities-list.component';
import { SecurityDetailComponent } from './features/securities/components/security-detail/security-detail.component';
import { StockDetailComponent } from './features/securities/components/stock-detail/stock-detail.component';
import { LoanListComponent } from './features/client/components/loan-list/loan-list.component';
import { LoanDetailsComponent } from './features/client/components/loan-details/loan-details.component';
import { ExchangeRateComponent } from './features/client/components/exchange-rate/exchange-rate.component';
import { LoanRequestManagementComponent } from './features/employee/components/loan-request-management/loan-request-management.component';
import { LoanManagementComponent } from './features/employee/components/loan-management/loan-management.component';
import { LoanRequestComponent } from './features/client/components/loan-request/loan-request.component';


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
  path: 'actuary-management',
  component: ActuaryManagementComponent,
  canActivate: [authGuard, roleGuard],
  data: { permission: 'FUND_AGENT_MANAGE' }
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
  path: 'exchange',
  component: ExchangeListComponent,
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
    path: 'payments/recipients',
    component: PaymentRecipientsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'payments',
    component: PaymentHistoryComponent,
     canActivate: [authGuard]
  },
  {
    path: 'loans',
    component: LoanListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'loans/request',
    component: LoanRequestComponent,
    canActivate: [authGuard]
  },
  {
    path: 'loans/:id',
    component: LoanDetailsComponent,
    canActivate: [authGuard]
  },
  {
  path: 'loan-request-management',
  component: LoanRequestManagementComponent,
  canActivate: [authGuard, roleGuard],
  data: { permission: 'CLIENT_MANAGE' }
},
{
  path: 'loan-management',
  component: LoanManagementComponent,
  canActivate: [authGuard, roleGuard],
  data: { permission: 'CLIENT_MANAGE' }
},
  {
    path: 'securities',
    component: SecuritiesListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'securities/stock/:ticker',
    component: StockDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'securities/future/:ticker',
    component: SecurityDetailComponent,
    canActivate: [authGuard],
    data: { securityType: 'future' }
  },
  {
    path: 'securities/forex/:ticker',
    component: SecurityDetailComponent,
    canActivate: [authGuard],
    data: { securityType: 'forex' }
  },
  {
    path: 'exchange',
    component: ExchangeRateComponent,
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
