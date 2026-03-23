import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ClientRoutingModule } from './client-routing.module';
import { AccountListComponent } from './components/account-list/account-list.component';
import { AccountDetailsModalComponent } from "./modals/account-details-modal/account-details-modal.component";
import { NewPaymentComponent } from './components/new-payment/new-payment.component';
@NgModule({
  declarations: [
  
    
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ClientRoutingModule,
    AccountListComponent,
    AccountDetailsModalComponent,
    NewPaymentComponent
  ]
})
export class ClientModule {}
