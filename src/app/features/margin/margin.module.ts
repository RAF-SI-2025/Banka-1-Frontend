import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MarginAccountPortalComponent } from './components/margin-account-portal/margin-account-portal.component';
// PR_31 T11: shared StateComponent za loading/empty/error markup.
import { StateComponent } from '../../shared/components/state/state.component';
/**
 * PR_03 C3.8: Margin feature module.
 *
 * Lazy-loaded preko ruta `/margin`. Ako/kada se doda employee-only kreiranje
 * racuna, dodaj zasebnu rutu (npr. `/margin/admin/create`) sa AuthGuard za
 * EMPLOYEE permission.
 */
const routes: Routes = [
  { path: '', component: MarginAccountPortalComponent }];

@NgModule({
  declarations: [
    MarginAccountPortalComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    StateComponent],
})
export class MarginModule {}
