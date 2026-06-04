import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ClientRoutingModule } from './client-routing.module';
import { AccountListComponent } from './components/account-list/account-list.component';
import { AccountDetailsModalComponent } from "./modals/account-details-modal/account-details-modal.component";
import { NewPaymentComponent } from './components/new-payment/new-payment.component';
import { TransactionDetailModalComponent } from './modals/transaction-detail-modal/transaction-detail-modal.component';
import {CardListComponent} from "@/features/client/components/card-list/card-list.component";
import { LoanListComponent } from './components/loan-list/loan-list.component';
import {RequestCardComponent} from "@/features/client/components/request-card/request-card.component";
import { LoanRequestComponent } from './components/loan-request/loan-request.component';

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
    TransactionDetailModalComponent,
    NewPaymentComponent,
    CardListComponent,
    LoanListComponent,
    RequestCardComponent,
    LoanRequestComponent
  ]
})
export class ClientModule {}
