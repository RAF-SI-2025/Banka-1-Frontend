import { Component, OnInit } from '@angular/core';

import { FundService } from '../../services/fund.service';
import { InvestmentFund } from '../../models/fund.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-fund-discovery',
  templateUrl: './fund-discovery.component.html',
})
export class FundDiscoveryComponent implements OnInit {
  funds: InvestmentFund[] = [];
  loading = false;
  error: string | null = null;

  /**
   * PR_31 T28: supervisor-only "Kreiraj fond" CTA u listing-u.
   * Gating se vezuje na `FUND_AGENT_MANAGE` permisiju — isti guard koristi route /funds/create
   * (funds.module.ts roleGuard). Bez ove permisije CTA se ne renderuje.
   */
  canCreateFund = false;

  constructor(
    private fundService: FundService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.canCreateFund = this.authService.hasPermission('FUND_AGENT_MANAGE');
    this.loading = true;
    this.fundService.discovery().subscribe({
      next: list => { this.funds = list; this.loading = false; },
      error: err => { this.error = err?.error?.message || 'Greska.'; this.loading = false; },
    });
  }
}
