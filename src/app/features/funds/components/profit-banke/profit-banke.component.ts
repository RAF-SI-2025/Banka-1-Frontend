import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { FundService } from '../../services/fund.service';
import { InvestmentFund } from '../../models/fund.model';
import { ActuaryService, BankProfitSummary } from '../../../employee/services/actuary.service';

/**
 * PR_05 C5.6 + PR_17 C17.6: Profit Banke portal (supervisor-only).
 *
 * <p>Spec (Celina 4.txt — Portal: Profit Banke): pregled bankine zarade.
 *
 * <p>Pre PR_17: komponenta je samo sumirala fund.profit polja iz {@code GET /funds}.
 * To pokriva fond-side, ali ne i trading-side koji je glavni izvor zarade banke
 * (komisije na izvrsenim trgovinama).
 *
 * <p>Posle PR_17:
 * <ul>
 *   <li>Trading-side: poziva GET /actuaries/profit/bank-summary (suma komisija + count).</li>
 *   <li>Fund-side: GET /funds (zbir fund.profit polja).</li>
 *   <li>Total = trading + fund.</li>
 * </ul>
 */
@Component({
  selector: 'app-profit-banke',
  templateUrl: './profit-banke.component.html',
})
export class ProfitBankeComponent implements OnInit {
  funds: InvestmentFund[] = [];
  fundsProfit = 0;
  bankSummary: BankProfitSummary | null = null;
  totalProfit = 0;
  loading = false;
  error: string | null = null;

  constructor(
    private fundService: FundService,
    private actuaryService: ActuaryService,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = null;
    forkJoin({
      funds: this.fundService.discovery(),
      summary: this.actuaryService.bankProfitSummary(),
    }).subscribe({
      next: ({ funds, summary }) => {
        this.funds = funds;
        this.fundsProfit = funds.reduce((sum, f) => sum + (f.profit ?? 0), 0);
        this.bankSummary = summary;
        const tradingProfit = summary?.totalCommission ?? 0;
        this.totalProfit = this.fundsProfit + tradingProfit;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju Profit Banke.';
        this.loading = false;
      },
    });
  }
}
