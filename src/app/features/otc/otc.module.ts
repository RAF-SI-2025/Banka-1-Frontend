import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { OtcPortalComponent } from './components/otc-portal/otc-portal.component';
import { OtcAvailableStocksComponent } from './components/otc-available-stocks/otc-available-stocks.component';
import { OtcPositionsComponent } from './components/otc-positions/otc-positions.component';
import { OtcOffersComponent } from './components/otc-offers/otc-offers.component';
import { OtcContractsComponent } from './components/otc-contracts/otc-contracts.component';
import { OtcCreateOfferComponent } from './components/otc-create-offer/otc-create-offer.component';
import { roleGuard } from '../../core/guards/role.guard';
import { StateComponent } from '../../shared/components/state/state.component';
import { OtcHistoryComponent } from '../otc/components/otc-history/otc-history.component';

const routes: Routes = [
  { path: '', component: OtcPortalComponent },
  {
    path: 'create',
    component: OtcCreateOfferComponent,
    canActivate: [roleGuard],
    data: {
      anyRole: ['CLIENT_TRADING'],
      anyPermission: ['SECURITIES_TRADE_LIMITED', 'SECURITIES_TRADE_UNLIMITED', 'TRADE_UNLIMITED'],
    },
  },
];

@NgModule({
  declarations: [
    OtcPortalComponent,
    OtcAvailableStocksComponent,
    OtcPositionsComponent,
    OtcOffersComponent,
    OtcContractsComponent,
    OtcCreateOfferComponent,
    OtcHistoryComponent,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes), StateComponent],
})
export class OtcModule {}
