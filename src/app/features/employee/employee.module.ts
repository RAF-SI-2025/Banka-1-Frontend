import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { EmployeeCreateComponent } from './components/employee-create/employee-create.component';
import { EmployeeEditComponent } from './components/employee-edit/employee-edit.component';
import { ExchangeListComponent } from './components/exchange-list/exchange-list.component';
import { ActuaryManagementComponent } from './components/actuary-management/actuary-management.component';
import { AccountManagementComponent } from './account-management/account-management.component';
import { AccountCardsPlaceholderComponent } from './account-cards-placeholder/account-cards-placeholder.component';
import { LoanRequestManagementComponent } from './components/loan-request-management/loan-request-management.component';
import { LoanManagementComponent } from './components/loan-management/loan-management.component';
import { OrdersOverviewComponent } from './components/orders-overview/orders-overview.component';

// PR_31 T10: shared AppPaginationComponent (standalone) — koriste je
// employee-list, actuary-management, loan-management, loan-request-management.
import { AppPaginationComponent } from '../../shared/components/pagination/pagination.component';
// PR_31 T11: shared StateComponent za loading/empty/error markup.
import { StateComponent } from '../../shared/components/state/state.component';

@NgModule({
  declarations: [
    EmployeeListComponent,
    EmployeeCreateComponent,
    EmployeeEditComponent,
    ActuaryManagementComponent,
    AccountCardsPlaceholderComponent,
    LoanRequestManagementComponent,
    LoanManagementComponent,
    OrdersOverviewComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    AccountManagementComponent,
    ExchangeListComponent,
    AppPaginationComponent,
    StateComponent],
})
export class EmployeeModule {}
