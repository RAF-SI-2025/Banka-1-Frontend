import { Component } from '@angular/core';

export type OtcTab = 'available-stocks' | 'positions' | 'negotiations' | 'contracts' | 'history';

@Component({
  selector: 'app-otc-portal',
  templateUrl: './otc-portal.component.html',
})
export class OtcPortalComponent {
  activeTab: OtcTab = 'available-stocks';

  setTab(tab: OtcTab): void {
    this.activeTab = tab;
  }
}
