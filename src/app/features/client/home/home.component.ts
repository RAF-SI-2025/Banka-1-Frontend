import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { StateComponent } from '../../../shared/components/state/state.component';
import { LucideIconComponent } from '../../../shared/icons/lucide-icon.component';
import { Account, PaymentRecipient } from '../models/account.model';
import { Transaction } from '../models/transaction.model';
import { AccountService } from '../services/account.service';
import { ClientService } from '../services/client.service';
import { ExchangeRate, ExchangeRateService } from '../services/exchange-rate.service';

/** Sve kurseve dobijamo u odnosu na RSD bazu (1 X = N RSD) iz backend price-feed-a. */
const BASE_QUOTE_CURRENCY = 'RSD';

/** Transaction.type -> Serbian display label (UI-only mapping). */
const TX_TYPE_LABELS: Record<string, string> = {
  PAYMENT: 'Placanje',
  TRANSFER: 'Transfer',
  DEPOSIT: 'Uplata',
  WITHDRAWAL: 'Isplata',
};

/**
 * PR_31 Task 14: Bloomberg-style dense-grid B home dashboard.
 *
 * Layout:
 *   1. Header (greeting + Novo placanje CTA)
 *   2. 3 stat tiles (prva 3 racuna sa availableBalance + currency + brojem)
 *   3. 2 mid cards (poslednjih 5 transakcija + brzo placanje sa chip primaoca)
 *   4. Kursna lista ribbon (compact, overflow-x scroll)
 *
 * Sve sekcije koriste shared z-* design tokene i `<app-state>` za loading/
 * empty/error stanja — tema (light/dark) prolazi automatski.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideIconComponent,
    StateComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  // ── Greeting ─────────────────────────────────
  userName = '';

  // ── Racuni ──────────────────────────────────
  accounts: Account[] = [];
  loading = true;
  error = false;

  // ── Transakcije ──────────────────────────────
  transactions: Transaction[] = [];
  transactionsLoading = false;
  transactionsError = false;

  // ── Primaoci (brzo placanje) ────────────────
  paymentRecipients: PaymentRecipient[] = [];
  recipientsLoading = true;

  // ── Kursevi valuta ──────────────────────────
  exchangeRates: ExchangeRate[] = [];

  constructor(
    private authService: AuthService,
    private accountService: AccountService,
    private clientService: ClientService,
    private exchangeRateService: ExchangeRateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.userName = this.deriveUserName();
    this.loadExchangeRates();
    this.loadAccounts();
  }

  // ── Data loaders ────────────────────────────

  loadAccounts(): void {
    this.loading = true;
    this.error = false;

    this.accountService.getMyAccounts().subscribe({
      next: (data: Account[]) => {
        this.accounts = data ?? [];
        this.loading = false;
        // Po default-u, ucitaj poslednjih 5 transakcija za prvi RSD racun.
        // Ako nema racuna, transakcije ostaju prazne ali state pokazuje empty.
        if (this.accounts.length > 0) {
          this.loadTransactions(this.accounts[0].accountNumber);
          this.loadRecipients(this.accounts[0].accountNumber);
        } else {
          this.recipientsLoading = false;
        }
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.recipientsLoading = false;
      },
    });
  }

  loadTransactions(accountNumber: string): void {
    this.transactionsLoading = true;
    this.transactionsError = false;
    this.transactions = [];

    this.accountService.getTransactions(accountNumber, 0, 5).subscribe({
      next: (data: Transaction[]) => {
        this.transactions = data ?? [];
        this.transactionsLoading = false;
      },
      error: () => {
        this.transactionsError = true;
        this.transactionsLoading = false;
      },
    });
  }

  loadRecipients(accountNumber: string): void {
    this.recipientsLoading = true;
    this.clientService.getAllRecipients(accountNumber, 0, 5).subscribe({
      next: (list: PaymentRecipient[]) => {
        this.paymentRecipients = list ?? [];
        this.recipientsLoading = false;
      },
      error: () => {
        this.paymentRecipients = [];
        this.recipientsLoading = false;
      },
    });
  }

  loadExchangeRates(): void {
    this.exchangeRateService.getRates().subscribe({
      next: (data) => {
        this.exchangeRates = data.rates ?? [];
      },
      error: () => {
        this.exchangeRates = [];
      },
    });
  }

  // ── Quick pay click → preusmeravanje na new-payment ─────────

  /**
   * Klik na chip primaoca: navigira na /accounts/payment/new sa pre-popunjenim
   * brojem racuna primaoca i njegovim nazivom kao opis. New-payment forma
   * cita query params i pre-popunjava polja, korisnik samo unese iznos.
   */
  payRecipient(r: PaymentRecipient): void {
    this.router.navigate(['/accounts/payment/new'], {
      queryParams: {
        recipientAccount: r.accountNumber,
        recipientName: r.name,
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  // ── Helper getters za template ──────────────

  /**
   * Izvlaci ime za pozdrav iz logged-user payload-a. AuthService cuva samo
   * email u localStorage (nema firstName), pa koristimo lokalni deo email-a
   * (pre "@") capitalized. Ako nista nije logged in, vraca prazan string —
   * template tada krije ", {{ userName }}" zarez.
   */
  private deriveUserName(): string {
    const u = this.authService.getLoggedUser();
    const email = u?.email ?? '';
    const local = email.split('@')[0] ?? '';
    if (!local) return '';
    // Capitalize prvog slova; ostalo ostaje kako jeste (email local part).
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  /** Subtitle ispod stat-card: "<subtype> · <currency>". */
  getAccountSubtitle(a: Account): string {
    const subtype = a.subtype ?? '';
    const currency = a.currency ?? 'RSD';
    return subtype ? `${subtype} · ${currency}` : currency;
  }

  // ── Transaction helpers ─────────────────────
  getTxRecipient(t: Transaction): string {
    return t.recipientName || t.description || '—';
  }

  getTxDate(t: Transaction): Date | string {
    return t.createdAt || new Date();
  }

  getTxLabel(t: Transaction): string {
    return TX_TYPE_LABELS[t.type] ?? t.type ?? '';
  }

  /**
   * Iznos sa znakom: za sve transakcije sa nase strane (PAYMENT, TRANSFER,
   * WITHDRAWAL) iznos je negativan; DEPOSIT je pozitivan. Backend ne salje
   * znak, pa ga izvlacimo iz tipa.
   */
  getTxAmount(t: Transaction): number {
    const abs = t.amount ?? 0;
    if (t.type === 'DEPOSIT') return abs;
    return -abs;
  }

  getTxCurrency(t: Transaction): string {
    return t.currency || 'RSD';
  }

  // ── Recipient helpers ───────────────────────
  getRecipientName(r: PaymentRecipient): string {
    return r.name || '?';
  }

  // ── Exchange rate helpers ───────────────────
  getRateFrom(r: ExchangeRate): string {
    return r.currency || '?';
  }

  getRateTo(_r: ExchangeRate): string {
    return BASE_QUOTE_CURRENCY;
  }

  getRateValue(r: ExchangeRate): number {
    return r.middleRate ?? r.sellRate ?? 0;
  }
}
