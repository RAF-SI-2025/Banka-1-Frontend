import { Component, OnInit } from '@angular/core';

import { FundService } from '../../services/fund.service';
import { InvestmentFund } from '../../models/fund.model';
import { AuthService } from '../../../../core/services/auth.service';

type SortField = 'naziv' | 'totalValue' | 'profit' | 'minimumContribution' | 'annualYield' | 'rewardToVariabilityRatio' | 'maxDrawdown' | 'volatility';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-fund-discovery',
  templateUrl: './fund-discovery.component.html',
})
export class FundDiscoveryComponent implements OnInit {
  private allFunds: InvestmentFund[] = [];
  funds: InvestmentFund[] = [];
  loading = false;
  error: string | null = null;
  canCreateFund = false;

  search = '';
  sortField: SortField = 'naziv';
  sortDir: SortDir = 'asc';

  constructor(
    private fundService: FundService,
    private authService: AuthService,
  ) {}

    ngOnInit(): void {
    this.canCreateFund = this.authService.hasPermission('FUND_AGENT_MANAGE');
    this.loading = true;
    this.fundService.discovery().subscribe({
      next: list => {
        this.allFunds = list || []; 
        this.apply(); 
        this.loading = false; 
      },
      error: err => { 
        this.error = err?.error?.message || 'Greska.'; 
        this.loading = false; 
      },
    });
  }

  apply(): void {
    const q = this.search.trim().toLowerCase();
    let result = q
      ? this.allFunds.filter(f => f.naziv.toLowerCase().includes(q) || (f.opis || '').toLowerCase().includes(q))
      : [...this.allFunds];

    result.sort((a, b) => {
      const av = a[this.sortField] as any;
      const bv = b[this.sortField] as any;

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return this.sortDir === 'asc' ? cmp : -cmp;
    });

    this.funds = result;
  }

  setSort(field: SortField): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.apply();
  }
}
