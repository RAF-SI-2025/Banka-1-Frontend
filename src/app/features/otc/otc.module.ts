import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { OtcOffersComponent } from './components/otc-offers/otc-offers.component';
import { OtcCreateOfferComponent } from './components/otc-create-offer/otc-create-offer.component';
import { OtcContractsComponent } from './components/otc-contracts/otc-contracts.component';
import { roleGuard } from '../../core/guards/role.guard';
// PR_31 T11: shared StateComponent za loading/empty/error markup.
import { StateComponent } from '../../shared/components/state/state.component';

const routes: Routes = [
  { path: '', redirectTo: 'offers', pathMatch: 'full' },
  { path: 'offers', component: OtcOffersComponent },
  {
    path: 'create',
    component: OtcCreateOfferComponent,
    canActivate: [roleGuard],
    data: {
      anyRole: ['CLIENT_TRADING'],
      anyPermission: ['SECURITIES_TRADE_LIMITED', 'SECURITIES_TRADE_UNLIMITED', 'TRADE_UNLIMITED'],
    },
  },
  { path: 'contracts', component: OtcContractsComponent }];

@NgModule({
  declarations: [OtcOffersComponent, OtcCreateOfferComponent, OtcContractsComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes), StateComponent],
})
export class OtcModule {}
