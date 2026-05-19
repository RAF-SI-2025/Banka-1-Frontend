import { Component, OnInit } from '@angular/core';

import { FundService } from '../../services/fund.service';
import { InvestmentFund } from '../../models/fund.model';
import { AuthService } from '../../../../core/services/auth.service';

// WP-26: sort polja prosirena sa 4 metric kljuca (Celina 4 — statistika fondova).
type SortField =
  | 'naziv'
  | 'totalValue'
  | 'profit'
  | 'minimumContribution'
  | 'annualizedReturn'
  | 'rewardToVariability'
  | 'maxDrawdown'
  | 'volatility';
type SortDir = 'asc' | 'desc';

// WP-26: metric kljucevi tretirani posebno pri sortiranju — null vrednosti
// (fond bez dovoljno snapshot-ova) uvek idu poslednje, nezavisno od smera.
const METRIC_FIELDS: ReadonlySet<SortField> = new Set<SortField>([
  'annualizedReturn',
  'rewardToVariability',
  'maxDrawdown',
  'volatility',
]);

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
      next: list => { this.allFunds = list; this.apply(); this.loading = false; },
      error: err => { this.error = err?.error?.message || 'Greska.'; this.loading = false; },
    });
  }

  apply(): void {
    const q = this.search.trim().toLowerCase();
    const result = q
      ? this.allFunds.filter(f => f.naziv.toLowerCase().includes(q) || (f.opis || '').toLowerCase().includes(q))
      : [...this.allFunds];

    const field = this.sortField;
    const isMetric = METRIC_FIELDS.has(field);
    result.sort((a, b) => {
      const av = a[field] as string | number | null;
      const bv = b[field] as string | number | null;

      // WP-26: fondovi bez metrike (null) uvek na dno, bez obzira na sortDir.
      if (isMetric) {
        const aNull = av === null || av === undefined;
        const bNull = bv === null || bv === undefined;
        if (aNull && bNull) return 0;
        if (aNull) return 1;
        if (bNull) return -1;
      }

      const cmp = (av as string | number) < (bv as string | number)
        ? -1
        : (av as string | number) > (bv as string | number)
          ? 1
          : 0;
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

  /** WP-26: frakcija (0.12) -> procenat string ("12,00%"); null -> placeholder. */
  metricPercent(value: number | null): string {
    if (value === null || value === undefined) {
      return '—';
    }
    return `${(value * 100).toLocaleString('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }

  /** WP-26: reward-to-variability je ratio (ne procenat) — 2 decimale, null -> placeholder. */
  metricRatio(value: number | null): string {
    if (value === null || value === undefined) {
      return '—';
    }
    return value.toLocaleString('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
