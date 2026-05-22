import { Component, OnInit } from '@angular/core';
import { OtcOfferStatus, OtcOffer } from '../../models/otc.model'; 

export interface OtcOfferHistory {
  id: number;
  timestamp: string;
  changedBy: string; 
  oldPrice: number | null;
  newPrice: number;
  oldQuantity: number | null;
  newQuantity: number;
}

export interface OtcNegotiationView {
  offer: OtcOffer;
  expanded?: boolean; 
  history: OtcOfferHistory[]; 
}

@Component({
  selector: 'app-otc-history',
  templateUrl: './otc-history.component.html',
})
export class OtcHistoryComponent implements OnInit {
  negotiations: OtcNegotiationView[] = [];
  loading = false;
  error: string | null = null;

  filters = {
    status: '' as OtcOfferStatus | '',
    dateFrom: '',
    dateTo: '',
    counterparty: ''
  };

  constructor(
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.error = null;

    // TODO: Kada backend endpoint bude spreman
    /*
    this.otcService.getHistory(this.filters).subscribe({
      next: (data: OtcNegotiationView[]) => {
        this.negotiations = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Greška pri učitavanju istorije pregovora.';
        this.loading = false;
        console.error(err);
      }
    });
    */

    // Privremeno: Prikazujemo prazan niz dok ne dobijemo podatke sa bekenda
    this.negotiations = [];
    this.loading = false;
  }

  applyFilters(): void { 
    this.loadHistory(); 
  }

  resetFilters(): void {
    this.filters = { status: '', dateFrom: '', dateTo: '', counterparty: '' };
    this.loadHistory();
  }

  toggleRow(neg: OtcNegotiationView): void {
    neg.expanded = !neg.expanded;
  }
}