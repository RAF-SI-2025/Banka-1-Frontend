// src/app/features/employee/employee.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { EmployeeCreateComponent } from './components/employee-create/employee-create.component';
import { EmployeeEditComponent } from './components/employee-edit/employee-edit.component';
import { AccountCreateComponent } from './components/account-create/account-create.component';
import {RouterModule} from "@angular/router";

@NgModule({
  declarations: [
    // ← ovde, ne u imports
    EmployeeListComponent,
    EmployeeCreateComponent,
    EmployeeEditComponent,
    AccountCreateComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class EmployeeModule { }
