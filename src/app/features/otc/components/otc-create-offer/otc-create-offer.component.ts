import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { OtcService } from '../../services/otc.service';
import {
  CreateInterbankNegotiationRequest,
  CreateOtcOfferRequest,
} from '../../models/otc.model';

export type OtcCreateMode = 'local' | 'banka2';

const BANKA2_ROUTING = 222;

/**
 * PR_05 C5.4 + PR_33 Phase B: OTC create-offer komponenta sa stock picker-om.
 *
 * Sprega sa portalom za hartije od vrednosti — kada klijent klikne "OTC ponuda"
 * na stranici stock detalja, otvara se forma sa popunjenim stockTicker-om i
 * kupcev id (iz JWT-a). Korisnik unosi sellerId, amount, pricePerStock, premium,
 * settlementDate.
 *
 * PR_33 Phase B: dodaje toggle "Naša banka / Banka 2". Kada je izabran "Banka 2",
 * sellerId input se zamenjuje stringom "C-{n}" / "E-{n}" + routingNumber je hard-coded
 * na 222. Submit se rutira na inter-bank wrapper (`createInterbankNegotiation`).
 */
@Component({
  selector: 'app-otc-create-offer',
  templateUrl: './otc-create-offer.component.html',
})
export class OtcCreateOfferComponent implements OnInit {
  @Input() preselectedStockTicker: string | null = null;

  form: FormGroup;
  loading = false;
  error: string | null = null;

  /** PR_33 Phase B: bira intra-bank vs cross-bank flow. */
  mode: OtcCreateMode = 'local';

  constructor(
    private fb: FormBuilder,
    private otcService: OtcService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      stockTicker: ['', [Validators.required, Validators.pattern(/^[A-Z0-9.]{1,16}$/)]],
      sellerId: [null, [Validators.required, Validators.min(1)]],
      // PR_33 Phase B: foreign id u formatu "C-{n}" ili "E-{n}".
      sellerForeignId: ['', [Validators.pattern(/^[CE]-\d+$/)]],
      amount: [null, [Validators.required, Validators.min(1)]],
      pricePerStock: [null, [Validators.required, Validators.min(0.01)]],
      premium: [null, [Validators.required, Validators.min(0)]],
      settlementDate: ['', Validators.required],
    });

    if (this.preselectedStockTicker) {
      this.form.patchValue({ stockTicker: this.preselectedStockTicker });
    }
  }

  /**
   * PR_33 follow-up: prepopuluj polja iz query params kad korisnik klikne
   * "Pripremi ponudu" iz Banka 2 public-stock discovery view-a.
   * Primer URL: /otc/create?mode=banka2&ticker=AAPL&sellerForeignId=C-1
   */
  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const modeParam = params.get('mode');
    if (modeParam === 'banka2' || modeParam === 'local') {
      this.setMode(modeParam);
    }
    const ticker = params.get('ticker');
    if (ticker) this.form.patchValue({ stockTicker: ticker });
    const sellerForeignId = params.get('sellerForeignId');
    if (sellerForeignId) this.form.patchValue({ sellerForeignId });
  }

  /**
   * PR_33 Phase B: prebacuje validators između intra-bank (sellerId required)
   * i cross-bank (sellerForeignId required) moda.
   */
  setMode(mode: OtcCreateMode): void {
    this.mode = mode;
    const sellerIdCtrl = this.form.controls['sellerId'];
    const sellerForeignCtrl = this.form.controls['sellerForeignId'];
    if (mode === 'banka2') {
      sellerIdCtrl.clearValidators();
      sellerIdCtrl.setValue(null);
      sellerForeignCtrl.setValidators([Validators.required, Validators.pattern(/^[CE]-\d+$/)]);
    } else {
      sellerForeignCtrl.clearValidators();
      sellerForeignCtrl.setValue('');
      sellerIdCtrl.setValidators([Validators.required, Validators.min(1)]);
    }
    sellerIdCtrl.updateValueAndValidity();
    sellerForeignCtrl.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    if (this.mode === 'banka2') {
      const v = this.form.value;
      // Backend `OutboundCreateNegotiationRequest.settlementDate` je
      // `OffsetDateTime` (Tim 2 protokol §3.4); HTML <input type="date">
      // daje samo "YYYY-MM-DD" pa rucno dodajemo midnight UTC suffix.
      const settlementIso = v.settlementDate ? `${v.settlementDate}T00:00:00Z` : '';
      const req: CreateInterbankNegotiationRequest = {
        stockTicker: v.stockTicker,
        settlementDate: settlementIso,
        priceCurrency: 'USD',
        pricePerUnit: v.pricePerStock,
        premiumCurrency: 'USD',
        premium: v.premium,
        sellerForeignBankId: {
          routingNumber: BANKA2_ROUTING,
          id: v.sellerForeignId,
        },
        amount: v.amount,
      };
      this.otcService.createInterbankNegotiation(req).subscribe({
        next: () => this.router.navigate(['/otc/offers']),
        error: err => {
          this.error = err?.error?.message || 'Greska pri kreiranju cross-bank pregovora.';
          this.loading = false;
        },
      });
      return;
    }
    const req = this.form.value as CreateOtcOfferRequest;
    this.otcService.createOffer(req).subscribe({
      next: () => this.router.navigate(['/otc/offers']),
      error: err => {
        this.error = err?.error?.message || 'Greska pri kreiranju ponude.';
        this.loading = false;
      },
    });
  }
}
