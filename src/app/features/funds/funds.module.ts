import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { FundDiscoveryComponent } from './components/fund-discovery/fund-discovery.component';
import { FundDetailsComponent } from './components/fund-details/fund-details.component';
import { ProfitBankeComponent } from './components/profit-banke/profit-banke.component';
import { MyFundsComponent } from './components/my-funds/my-funds.component';
import { ProfitAktuaraComponent } from './components/profit-aktuara/profit-aktuara.component';
import { CreateFundComponent } from './components/create-fund/create-fund.component';
// PR_19 C19.5 + C19.6: shared standalone components.
import { StateComponent } from '../../shared/components/state/state.component';
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';
// WP-26: standalone multi-series chart za statistiku fondova.
import { FundHistoryChartComponent } from '../../shared/charts/fund-history-chart/fund-history-chart.component';
import { roleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  { path: '', component: FundDiscoveryComponent },
  {
    path: 'profit-banke',
    component: ProfitBankeComponent,
    canActivate: [roleGuard],
    data: { permission: 'FUND_AGENT_MANAGE' },
  },
  {
    path: 'profit-aktuara',
    component: ProfitAktuaraComponent,
    canActivate: [roleGuard],
    data: { permission: 'FUND_AGENT_MANAGE' },
  },
  { path: 'my-funds', component: MyFundsComponent },
  {
    path: 'create',
    component: CreateFundComponent,
    canActivate: [roleGuard],
    data: { permission: 'FUND_AGENT_MANAGE' },
  },
  { path: ':id', component: FundDetailsComponent }];

@NgModule({
  declarations: [
    FundDiscoveryComponent,
    FundDetailsComponent,
    ProfitBankeComponent,
    MyFundsComponent,
    ProfitAktuaraComponent,
    CreateFundComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    StateComponent,
    FormModalComponent,
    FundHistoryChartComponent],
})
export class FundsModule {}
