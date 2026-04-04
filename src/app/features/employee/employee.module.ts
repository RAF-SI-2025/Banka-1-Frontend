import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { EmployeeCreateComponent } from './components/employee-create/employee-create.component';
import { EmployeeEditComponent } from './components/employee-edit/employee-edit.component';
import { ActuaryManagementComponent } from './components/actuary-management/actuary-management.component';
import { AccountManagementComponent } from './account-management/account-management.component';
import { AccountCardsPlaceholderComponent } from './account-cards-placeholder/account-cards-placeholder.component';
import { NavbarComponent } from 'src/app/shared/components/navbar/navbar.component';

@NgModule({
  declarations: [
    EmployeeListComponent,
    EmployeeCreateComponent,
    EmployeeEditComponent,
    ActuaryManagementComponent,
    AccountCardsPlaceholderComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    AccountManagementComponent,
    NavbarComponent
  ]
})
export class EmployeeModule { }
