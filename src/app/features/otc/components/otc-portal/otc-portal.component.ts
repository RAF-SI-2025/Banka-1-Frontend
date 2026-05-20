import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export type OtcTab = 'available-stocks' | 'positions' | 'negotiations' | 'contracts';

const VALID_TABS: OtcTab[] = ['available-stocks', 'positions', 'negotiations', 'contracts'];

@Component({
  selector: 'app-otc-portal',
  templateUrl: './otc-portal.component.html',
})
export class OtcPortalComponent implements OnInit {
  activeTab: OtcTab = 'available-stocks';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Inicijalni tab moze doci iz route data (deep-link `/otc/offers` postavlja
    // 'negotiations') ili query param (`/otc?tab=contracts`).
    const dataTab = this.route.snapshot.data?.['initialTab'] as OtcTab | undefined;
    const queryTab = this.route.snapshot.queryParamMap.get('tab') as OtcTab | null;
    const requested = queryTab || dataTab;
    if (requested && VALID_TABS.includes(requested)) {
      this.activeTab = requested;
    }
  }

  setTab(tab: OtcTab): void {
    this.activeTab = tab;
  }
}
