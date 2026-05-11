import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AccountListComponent } from './components/account-list/account-list.component';
import { NewPaymentComponent } from './components/new-payment/new-payment.component';
import { CardListComponent } from './components/card-list/card-list.component';
import { RequestCardComponent } from "@/features/client/components/request-card/request-card.component";
import { OtcActiveOffersComponent } from './components/otc-active-offers/otc-active-offers.component';
import { authGuard } from "@/core/guards/auth.guard";
import { clientOrActuaryGuard } from "@/core/guards/client-or-actuary.guard";

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'accounts',
    component: AccountListComponent
  },
  { path: 'cards', component: CardListComponent },
  { path: 'cards/request', component: RequestCardComponent, canActivate: [authGuard] },
  { path: 'otc-offers', component: OtcActiveOffersComponent, canActivate: [authGuard, clientOrActuaryGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientRoutingModule { }
