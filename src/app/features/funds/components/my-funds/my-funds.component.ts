import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { forkJoin } from 'rxjs';

import { FundService } from '../../services/fund.service';
import { ClientFundPosition, InvestmentFund } from '../../models/fund.model';

interface PositionWithFund {
  position: ClientFundPosition;
  fund?: InvestmentFund;
  pctOfFund?: number;
}

interface ModalState {
  open: boolean;
  mode: 'invest' | 'redeem';
  row: PositionWithFund | null;
  amount: string;
  account: string;
  submitting: boolean;
  errorMessage: string | null;
}

/**
 * PR_11 C11.8 + PR_14 C14.10 + PR_17 C17.7-C17.8: Moji fondovi tabela
 * (Spec: Celina 4.txt — "Moj portfolio -> Moji fondovi").
 *
 * <p>PR_14 dodaje invest/redeem dugmadi.
 * <p>PR_17 C17.7: N+1 fix — koristi forkJoin (myPositions + discovery), in-memory
 *  lookup po fundId umesto N detail poziva.
 * <p>PR_17 C17.8: prompt() zamenjen native HTML &lt;dialog&gt; elementom — bez
 *  external modal biblioteke. Sva validacija ostaje u TS, dialog je samo UI shell.
 */
@Component({
  selector: 'app-my-funds',
  templateUrl: './my-funds.component.html',
})
export class MyFundsComponent implements OnInit {

  rows: PositionWithFund[] = [];
  loading = false;
  error: string | null = null;

  modal: ModalState = {
    open: false,
    mode: 'invest',
    row: null,
    amount: '',
    account: '',
    submitting: false,
    errorMessage: null,
  };

  constructor(private fundService: FundService) {}

  ngOnInit(): void {
    this.load();
  }

  /**
   * PR_17 C17.7: N+1 fix. Pre PR_17 komponenta je za N pozicija pravila N+1 HTTP
   * pozive (1 myPositions + N details). Sada poziva 2 endpoint-a paralelno
   * (myPositions + discovery vraca sve fondove) i radi lookup u memoriji po fundId.
   */
  load(): void {
    this.loading = true;
    this.error = null;
    forkJoin({
      positions: this.fundService.myPositions(),
      funds: this.fundService.discovery(),
    }).subscribe({
      next: ({ positions, funds }) => {
        const fundsById = new Map(funds.map(f => [f.id, f]));
        this.rows = positions.map(p => {
          const fund = fundsById.get(p.fundId);
          return {
            position: p,
            fund,
            pctOfFund: fund && fund.totalValue > 0
              ? (p.totalInvested / fund.totalValue) * 100
              : 0,
          };
        });
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju pozicija.';
        this.loading = false;
      },
    });
  }

  openInvest(row: PositionWithFund): void {
    if (!row.fund) {
      return;
    }
    this.modal = {
      open: true,
      mode: 'invest',
      row,
      amount: '',
      account: '',
      submitting: false,
      errorMessage: null,
    };
  }

  openRedeem(row: PositionWithFund): void {
    if (!row.fund) {
      return;
    }
    this.modal = {
      open: true,
      mode: 'redeem',
      row,
      amount: '',
      account: '',
      submitting: false,
      errorMessage: null,
    };
  }

  closeModal(): void {
    this.modal.open = false;
  }

  submitModal(): void {
    const { row, mode, amount: amountStr, account } = this.modal;
    if (!row || !row.fund) {
      return;
    }

    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.modal.errorMessage = 'Neispravan iznos.';
      return;
    }

    if (mode === 'invest') {
      if (amount < row.fund.minimumContribution) {
        this.modal.errorMessage = `Iznos ispod minimuma (${row.fund.minimumContribution}).`;
        return;
      }
    } else {
      if (amount > row.position.totalInvested) {
        this.modal.errorMessage = `Iznos veci od ulozenog (${row.position.totalInvested}).`;
        return;
      }
    }

    if (!account || account.trim().length === 0) {
      this.modal.errorMessage = 'Broj racuna je obavezan.';
      return;
    }

    this.modal.submitting = true;
    this.modal.errorMessage = null;

    const obs = mode === 'invest'
      ? this.fundService.invest(row.fund.id, { amount, fromAccountNumber: account })
      : this.fundService.redeem(row.fund.id, { amount, toAccountNumber: account });

    obs.subscribe({
      next: () => {
        this.modal.open = false;
        this.modal.submitting = false;
        this.load();
      },
      error: err => {
        this.modal.submitting = false;
        this.modal.errorMessage = err?.error?.message
          || (mode === 'invest' ? 'Greska pri pokretanju uplate.' : 'Greska pri pokretanju isplate.');
      },
    });
  }
}
