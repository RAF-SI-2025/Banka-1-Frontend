import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MarginAccountService } from '../../services/margin-account.service';
import {
  MarginAccountResponse,
  MarginTransactionHistoryItem,
} from '../../models/margin-account.model';

/**
 * PR_03 C3.8: glavna komponenta portala za marzne racune.
 *
 * Funkcionalnosti:
 *   - Pregled stanja postojeceg racuna (initialMargin, loanValue, active flag).
 *   - Uplata sa tekuceg na marzni (addToMargin).
 *   - Isplata sa marznog na tekuci (withdrawFromMargin).
 *   - Istorija transakcija (getAllMarginTransactions).
 *
 * Kreiranje novog racuna je u zasebnoj employee-only komponenti
 * (MarginAccountCreateComponent — TBD u nastavku PR_03).
 */
@Component({
  selector: 'app-margin-account-portal',
  templateUrl: './margin-account-portal.component.html',
  styleUrls: ['./margin-account-portal.component.scss'],
})
export class MarginAccountPortalComponent implements OnInit {

  account: MarginAccountResponse | null = null;
  transactions: MarginTransactionHistoryItem[] = [];
  loading = false;
  error: string | null = null;

  addForm: FormGroup;
  withdrawForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private marginService: MarginAccountService,
  ) {
    this.addForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
    });
    this.withdrawForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit(): void {
    this.loadAccount();
  }

  loadAccount(): void {
    this.loading = true;
    this.error = null;
    const userId = this.getCurrentUserId();
    if (userId == null) {
      this.error = 'User not logged in.';
      this.loading = false;
      return;
    }
    this.marginService.getForUser(userId).subscribe({
      next: acc => {
        this.account = acc;
        this.loadTransactions(acc.accountNumber);
      },
      error: err => {
        this.account = null;
        this.error = err?.error?.message || 'Marzni racun ne postoji za ovog korisnika.';
        this.loading = false;
      },
    });
  }

  loadTransactions(accountNumber: string): void {
    this.marginService.getAllTransactions(accountNumber).subscribe({
      next: items => {
        this.transactions = items;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju transakcija.';
        this.loading = false;
      },
    });
  }

  onAdd(): void {
    if (!this.account || this.addForm.invalid) return;
    const userId = this.getCurrentUserId();
    if (userId == null) return;
    this.marginService.addToMargin(userId, { amount: this.addForm.value.amount }).subscribe({
      next: () => {
        this.addForm.reset();
        this.loadAccount();
      },
      error: err => this.error = err?.error?.message || 'Greska pri uplati.',
    });
  }

  onWithdraw(): void {
    if (!this.account || this.withdrawForm.invalid) return;
    const userId = this.getCurrentUserId();
    if (userId == null) return;
    this.marginService.withdrawFromMargin(userId, { amount: this.withdrawForm.value.amount }).subscribe({
      next: () => {
        this.withdrawForm.reset();
        this.loadAccount();
      },
      error: err => this.error = err?.error?.message || 'Greska pri isplati. Proveri da li racun aktivan i da li bi isplata spustila stanje ispod maintenance.',
    });
  }

  /**
   * Cita JWT iz localStorage i izvlaci `id` claim. U pravoj implementaciji
   * pozivao bi AuthService koji vec postoji u core/.
   */
  private getCurrentUserId(): number | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      const payloadB64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadB64));
      return Number(payload['id'] ?? payload['sub']);
    } catch {
      return null;
    }
  }
}
