import { Component, OnInit } from '@angular/core';
import { OtcService } from '../../services/otc.service';
import { OtcPosition } from '../../models/otc.model';

@Component({
  selector: 'app-otc-positions',
  templateUrl: './otc-positions.component.html',
})
export class OtcPositionsComponent implements OnInit {

  positions: OtcPosition[] = [];
  loading = false;
  error: string | null = null;

  /** Add modal */
  addOpen = false;
  addDraft = { listingId: 0, publicQuantity: 0 };
  addSubmitting = false;
  addError: string | null = null;

  /** Edit modal */
  editTarget: OtcPosition | null = null;
  editPublicQuantity = 0;
  editSubmitting = false;
  editError: string | null = null;

  constructor(private otcService: OtcService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.otcService.getMyPositions().subscribe({
      next: items => {
        this.positions = items;
        this.loading = false;
      },
      error: err => {
        this.error = err?.error?.message || 'Greska pri ucitavanju OTC pozicija.';
        this.loading = false;
      },
    });
  }

  // ------ Add ------

  openAdd(): void {
    this.addDraft = { listingId: 0, publicQuantity: 0 };
    this.addError = null;
    this.addOpen = true;
  }

  closeAdd(): void {
    this.addOpen = false;
    this.addError = null;
  }

  submitAdd(): void {
    const d = this.addDraft;
    if (d.listingId <= 0 || d.publicQuantity <= 0) {
      this.addError = 'Unesite validan ID pozicije i količinu veću od 0.';
      return;
    }
    this.addSubmitting = true;
    this.otcService.createPosition({ listingId: d.listingId, publicQuantity: d.publicQuantity }).subscribe({
      next: () => {
        this.addSubmitting = false;
        this.closeAdd();
        this.load();
      },
      error: err => {
        this.addSubmitting = false;
        this.addError = err?.error?.message || 'Greska pri dodavanju pozicije.';
      },
    });
  }

  // ------ Edit ------

  openEdit(pos: OtcPosition): void {
    this.editTarget = pos;
    this.editPublicQuantity = pos.publicQuantity;
    this.editError = null;
  }

  closeEdit(): void {
    this.editTarget = null;
    this.editError = null;
  }

  submitEdit(): void {
    if (!this.editTarget) return;
    if (this.editPublicQuantity <= 0) {
      this.editError = 'Količina mora biti veća od 0.';
      return;
    }
    if (this.editPublicQuantity < this.editTarget.reservedQuantity) {
      this.editError = `Ne možete smanjiti ispod rezervisane količine (${this.editTarget.reservedQuantity}).`;
      return;
    }
    this.editSubmitting = true;
    this.otcService.updatePosition(this.editTarget.id, { publicQuantity: this.editPublicQuantity }).subscribe({
      next: () => {
        this.editSubmitting = false;
        this.closeEdit();
        this.load();
      },
      error: err => {
        this.editSubmitting = false;
        this.editError = err?.error?.message || 'Greska pri izmeni pozicije.';
      },
    });
  }

  // ------ Remove ------

  remove(pos: OtcPosition): void {
    if (pos.reservedQuantity > 0) {
      alert(`Ne možete ukloniti poziciju dok postoje aktivne rezervacije (${pos.reservedQuantity} akcija).`);
      return;
    }
    if (!confirm(`Ukloniti ${pos.stockTicker} iz OTC ponude?`)) return;
    this.otcService.deletePosition(pos.id).subscribe({
      next: () => this.load(),
      error: err => this.error = err?.error?.message || 'Greska pri uklanjanju pozicije.',
    });
  }
}
