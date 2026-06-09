import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { OtcService } from '../../services/otc.service';
import {
  OtcInterbankContract,
  OtcInterbankContractStatus,
} from '../../models/otc.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';

/** Routing number nase banke (Banka 1). Mora se poklapati sa OtcService. */
const BANKA1_ROUTING = 111;

/**
 * Cross-bank OTC opcioni ugovori — sklopljeni ugovori koje je korisnik kupio od
 * druge banke (npr. Banka 2). Sibling view aktivnim cross-bank pregovorima
 * (`app-otc-offers`); ovde se prikazuju vec sklopljeni ugovori i nudi se
 * "Iskoristi" (exercise) akcija za ACTIVE ugovore gde je current user kupac.
 *
 * <p>Backend: `GET /api/interbank/otc/contracts/my` +
 * `POST /api/interbank/otc/contracts/{localId}/exercise`. Uspeh/greska se
 * prikazuju kroz globalni {@link ToastService}.
 */
@Component({
  selector: 'app-otc-interbank-contracts',
  templateUrl: './otc-interbank-contracts.component.html',
})
export class OtcInterbankContractsComponent implements OnInit, OnDestroy {

  contracts: OtcInterbankContract[] = [];
  loading = false;
  error: string | null = null;

  /** localId ugovora koji se trenutno exercise-uje (disable dugme + spinner). */
  exercisingId: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private otcService: OtcService,
    private authService: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.otcService.listMyContracts().pipe(takeUntil(this.destroy$)).subscribe({
      next: items => {
        this.contracts = items;
        this.loading = false;
      },
      error: err => {
        this.error = this.friendlyError(err, 'Greska pri ucitavanju ugovora.');
        this.contracts = [];
        this.loading = false;
      },
    });
  }

  trackByLocalId(_index: number, c: OtcInterbankContract): string {
    return c.localId;
  }

  /** Display naziv counterparty banke za prikaz u tabeli. */
  counterpartyBankName(c: OtcInterbankContract): string {
    const routing = this.iAmBuyer(c) ? c.sellerId.routingNumber : c.buyerId.routingNumber;
    if (routing === 222) return 'Banka 2';
    if (routing === BANKA1_ROUTING) return 'Naša banka';
    return `Banka #${routing}`;
  }

  /** "{routing}:{id}" identifikator druge strane ugovora. */
  counterpartyLabel(c: OtcInterbankContract): string {
    const party = this.iAmBuyer(c) ? c.sellerId : c.buyerId;
    return `${party.routingNumber}:${party.id}`;
  }

  /** Da li je current user kupac ovog ugovora (mora biti iz nase banke). */
  iAmBuyer(c: OtcInterbankContract): boolean {
    if (c.buyerId.routingNumber !== BANKA1_ROUTING) return false;
    const myId = this.authService.getUserIdFromToken();
    if (myId == null) return false;
    return this.localIdNumber(c.buyerId.id) === myId;
  }

  /**
   * Exercise je moguc samo za ACTIVE ugovore, gde je current user kupac i
   * settlement datum jos nije prosao.
   */
  canExercise(c: OtcInterbankContract): boolean {
    return c.status === 'ACTIVE'
      && this.iAmBuyer(c)
      && new Date(c.settlementDate) >= new Date()
      && this.exercisingId == null;
  }

  exercise(c: OtcInterbankContract): void {
    if (!this.canExercise(c)) return;
    if (!confirm(`Iskoristiti opciju za ${c.amount}× ${c.ticker} po ${c.strikeAmount} ${c.strikeCurrency}?`)) {
      return;
    }
    this.exercisingId = c.localId;
    this.otcService.exerciseContract(c.localId).pipe(takeUntil(this.destroy$)).subscribe({
      next: updated => {
        this.exercisingId = null;
        this.toast.success(`Opcija ${updated.ticker} uspešno iskorišćena.`);
        this.load();
      },
      error: err => {
        this.exercisingId = null;
        this.toast.error(this.friendlyError(err, 'Greska pri iskorišćavanju opcije.'));
      },
    });
  }

  statusBadgeClass(status: OtcInterbankContractStatus): Record<string, boolean> {
    return {
      'z-badge-green': status === 'ACTIVE',
      'z-badge-blue': status === 'EXERCISED',
      'z-badge-gray': status === 'EXPIRED',
    };
  }

  /** Numericki sufiks iz "C-{n}" / "E-{n}" foreign id-a; NaN ako format ne odgovara. */
  private localIdNumber(foreignId: string): number {
    const idx = foreignId.lastIndexOf('-');
    return Number(idx >= 0 ? foreignId.substring(idx + 1) : foreignId);
  }

  /**
   * Mapira HTTP error u prijateljsku poruku. Backend cross-bank rute vracaju
   * `{ error: "..." }`; padamo nazad na `message` ili default tekst.
   */
  private friendlyError(err: unknown, fallback: string): string {
    const body = (err as { error?: { error?: string; message?: string } } | null)?.error;
    return body?.error || body?.message || fallback;
  }
}
