import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FundService } from '../../services/fund.service';
import { InvestmentFund } from '../../models/fund.model';

/**
 * PR_05 C5.5: detaljan prikaz fonda + invest/redeem forme.
 * Spec: Celina 4.txt — Stranice / Detaljan prikaz fonda.
 */
@Component({
  selector: 'app-fund-details',
  templateUrl: './fund-details.component.html',
})
export class FundDetailsComponent implements OnInit {
  fund: InvestmentFund | null = null;
  fundId!: number;
  loading = false;
  error: string | null = null;

  investForm: FormGroup;
  redeemForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private fundService: FundService,
    private fb: FormBuilder,
    public router: Router,
  ) {
    this.investForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      fromAccountNumber: ['', Validators.required],
    });
    this.redeemForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      toAccountNumber: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.fundId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.fundService.details(this.fundId).subscribe({
      next: f => { this.fund = f; this.loading = false; },
      error: err => { this.error = err?.error?.message || 'Greska.'; this.loading = false; },
    });
  }

  onInvest(): void {
    if (this.investForm.invalid) return;
    this.fundService.invest(this.fundId, this.investForm.value).subscribe({
      next: () => {
        this.investForm.reset();
        alert('Uplata pokrenuta. Status mozete pratiti u "Moji fondovi".');
      },
      error: err => this.error = err?.error?.message || 'Greska pri uplati.',
    });
  }

  onRedeem(): void {
    if (this.redeemForm.invalid) return;
    this.fundService.redeem(this.fundId, this.redeemForm.value).subscribe({
      next: () => {
        this.redeemForm.reset();
        alert('Isplata pokrenuta. Ako likvidnost fonda nije dovoljna, hartije ce biti automatski likvidirane (mozda potraje).');
      },
      error: err => this.error = err?.error?.message || 'Greska pri isplati.',
    });
  }
}
