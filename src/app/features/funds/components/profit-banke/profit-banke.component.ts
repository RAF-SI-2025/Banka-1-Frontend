import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { FundService } from '../../services/fund.service';
import { ClientFundPosition, InvestmentFund } from '../../models/fund.model';
import { ActuaryService, BankProfitSummary } from '../../../employee/services/actuary.service';

interface ModalState {
  open: boolean;
  mode: 'invest' | 'redeem';
  position: ClientFundPosition | null;
  fund: InvestmentFund | null;
  amount: string;
  account: string;
  submitting: boolean;
  errorMessage: string | null;
}

@Component({
  selector: 'app-profit-banke',
  templateUrl: './profit-banke.component.html',
})
export class ProfitBankeComponent implements OnInit {
  bankPositions: ClientFundPosition[] = [];
  fundsById = new Map<number, InvestmentFund>();
  bankSummary: BankProfitSummary | null = null;
  fundsProfit = 0;
  totalProfit = 0;
  loading = false;
  error: string | null = null;

  modal: ModalState = {
    open: false,
    mode: 'invest',
    position: null,
    fund: null,
    amount: '',
    account: '',
    submitting: false,
    errorMessage: null,
  };

  constructor(
    private fundService: FundService,
    private actuaryService: ActuaryService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    forkJoin({
      bankPositions: this.fundService.bankPositions(),
      funds: this.fundService.discovery(),
      summary: this.actuaryService.bankProfitSummary(),
    }).subscribe({
      next: ({ bankPositions, funds, summary }) => {
        this.fundsById = new Map(funds.map(f => [f.id, f]));
        this.bankPositions = bankPositions;
        this.bankSummary = summary;
        this.fundsProfit = bankPositions.reduce((sum, p) => sum + (p.clientProfit ?? 0), 0);
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

  fundName(fundId: number): string {
    return this.fundsById.get(fundId)?.naziv ?? `Fond #${fundId}`;
  }

  openInvest(p: ClientFundPosition): void {
    const fund = this.fundsById.get(p.fundId) ?? null;
    this.modal = { open: true, mode: 'invest', position: p, fund, amount: '', account: '', submitting: false, errorMessage: null };
  }

  openRedeem(p: ClientFundPosition): void {
    const fund = this.fundsById.get(p.fundId) ?? null;
    this.modal = { open: true, mode: 'redeem', position: p, fund, amount: '', account: '', submitting: false, errorMessage: null };
  }

  closeModal(): void {
    this.modal.open = false;
  }

  submitModal(): void {
    const { position, mode, amount: amountStr, account } = this.modal;
    if (!position) return;

    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.modal.errorMessage = 'Neispravan iznos.';
      return;
    }

    if (mode === 'redeem' && amount > position.currentPositionValue) {
      this.modal.errorMessage = `Iznos veci od bankine pozicije (${position.currentPositionValue.toFixed(2)}).`;
      return;
    }

    if (!account || account.trim().length === 0) {
      this.modal.errorMessage = 'Broj racuna je obavezan.';
      return;
    }

    this.modal.submitting = true;
    this.modal.errorMessage = null;

    const obs = mode === 'invest'
      ? this.fundService.bankInvest(position.fundId, { amount, fromAccountNumber: account })
      : this.fundService.bankRedeem(position.fundId, { amount, toAccountNumber: account });

    obs.subscribe({
      next: () => {
        this.modal.open = false;
        this.modal.submitting = false;
        this.load();
      },
      error: err => {
        this.modal.submitting = false;
        this.modal.errorMessage = err?.error?.message
          || (mode === 'invest' ? 'Greska pri uplati.' : 'Greska pri isplati.');
      },
    });
  }
}
