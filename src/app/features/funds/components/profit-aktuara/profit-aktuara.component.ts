import { Component, OnInit } from '@angular/core';

import { ActuaryProfit, ActuaryService } from '../../../employee/services/actuary.service';

interface ProfitRow {
  userId: number;
  totalCommission: number;
  transactionCount: number;
  displayName: string;
  pozicija?: string;
}

/**
 * PR_11 C11.9 + PR_14 C14.9: Profit aktuara stranica (Spec: Celina 4.txt —
 * "Portal: Profit Banke / Stranica: Profit aktuara").
 *
 * <p>PR_14 ispravlja domensku gresku iz PR_11: pre PR_14 stranica je sumirala
 * AUM po fund manageru (pogresan domen — fond menadzeri NISU isti entitet kao
 * trgovacki aktuari). Sada poziva GET /actuaries/profit koji vraca pravi trading
 * P&L (sumu komisija po Order.userId-u sa izvrsenih transakcija).
 *
 * <p>Komisije su izvor banke od trgovine — sto vise prometa aktuar pravi, to
 * vise banka zaradjuje. Time je Profit aktuara metric primenjivat za
 * supervizora kada odlucuje o limitima i bonusima.
 */
@Component({
  selector: 'app-profit-aktuara',
  templateUrl: './profit-aktuara.component.html',
})
export class ProfitAktuaraComponent implements OnInit {

  rows: ProfitRow[] = [];
  loading = false;
  error: string | null = null;

  constructor(private actuaryService: ActuaryService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.actuaryService.profitByActuary().subscribe({
      next: items => {
        this.rows = items.map(this.toRow);
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju profit aktuara.';
        this.rows = [];
        this.loading = false;
      },
    });
  }

  private toRow(item: ActuaryProfit): ProfitRow {
    const fullName = [item.ime, item.prezime].filter(Boolean).join(' ').trim();
    return {
      userId: item.userId,
      totalCommission: item.totalCommission,
      transactionCount: item.transactionCount,
      // PR_15 C15.7: prikaz imena ako employee-service uspesno enrich-uje;
      // fallback na "#userId" ako lookup nije uspeo.
      displayName: fullName.length > 0 ? fullName : `#${item.userId}`,
      pozicija: item.pozicija,
    };
  }
}
