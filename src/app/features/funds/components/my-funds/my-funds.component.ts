import { Component, OnInit } from '@angular/core';

import { FundService } from '../../services/fund.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ClientFundPosition, InvestmentFund } from '../../models/fund.model';

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
  selector: 'app-my-funds',
  templateUrl: './my-funds.component.html',
})
export class MyFundsComponent implements OnInit {
  isSupervisor = false;

  // client view
  positions: ClientFundPosition[] = [];

  // supervisor view
  supervisedFunds: InvestmentFund[] = [];

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
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.isSupervisor = this.authService.hasPermission('FUND_AGENT_MANAGE');
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;

    const obs: any = this.isSupervisor
      ? this.fundService.supervised()
      : this.fundService.myPositions();

    obs.subscribe({
      next: (data: any) => {
        if (this.isSupervisor) {
          this.supervisedFunds = data as InvestmentFund[];
        } else {
          this.positions = data as ClientFundPosition[];
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Greska pri ucitavanju.';
        this.loading = false;
      },
    });
  }

  openInvest(position: ClientFundPosition): void {
    this.modal = {
      open: true,
      mode: 'invest',
      position,
      fund: null,
      amount: '',
      account: '',
      submitting: false,
      errorMessage: null,
    };
  }

  openRedeem(position: ClientFundPosition): void {
    this.modal = {
      open: true,
      mode: 'redeem',
      position,
      fund: null,
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
    const { position, mode, amount: amountStr, account } = this.modal;
    if (!position) return;

    const amount = Number(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.modal.errorMessage = 'Neispravan iznos.';
      return;
    }

    if (mode === 'redeem' && amount > position.currentPositionValue) {
      this.modal.errorMessage = `Iznos veci od trenutne vrednosti pozicije (${position.currentPositionValue.toFixed(2)}).`;
      return;
    }

    if (!account || account.trim().length === 0) {
      this.modal.errorMessage = 'Broj racuna je obavezan.';
      return;
    }

    this.modal.submitting = true;
    this.modal.errorMessage = null;

    const obs = mode === 'invest'
      ? this.fundService.invest(position.fundId, { amount, fromAccountNumber: account })
      : this.fundService.redeem(position.fundId, { amount, toAccountNumber: account });

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
