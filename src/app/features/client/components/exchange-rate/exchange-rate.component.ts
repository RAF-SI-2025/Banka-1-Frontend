import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { CurrencyCalculatorComponent } from '../currency-calculator/currency-calculator.component';
import { ExchangeRate, ExchangeRateService } from '../../services/exchange-rate.service';

type Tab = 'rates' | 'calculator';

@Component({
  selector: 'app-exchange-rate',
  standalone: true,
  imports: [CommonModule, NavbarComponent, CurrencyCalculatorComponent],
  templateUrl: './exchange-rate.component.html',
  styleUrls: ['./exchange-rate.component.scss']
})
export class ExchangeRateComponent implements OnInit {

  activeTab: Tab = 'rates';

  rates: ExchangeRate[] = [];
  lastUpdated: Date | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(private exchangeRateService: ExchangeRateService) {}

  ngOnInit(): void {
    this.loadRates();
  }

  /**
   * Dohvata kurseve pri učitavanju stranice.
   * Kursevi se dele sa CurrencyCalculatorComponent kroz @Input()
   * da se izbegne dupli API poziv.
   */
  loadRates(): void {
    this.isLoading = true;
    this.error     = null;

    this.exchangeRateService.getRates().subscribe({
      next: res => {
        this.rates       = res.rates;
        this.lastUpdated = res.lastUpdated;
        this.isLoading   = false;
      },
      error: () => {
        this.error     = 'Greška pri učitavanju kurseva. Molimo pokušajte ponovo.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Postavlja aktivni tab.
   */
  setTab(tab: Tab): void {
    this.activeTab = tab;
  }

  /**
   * Formatira kurs na 4 decimale u srpskom formatu (npr. 117,6626).
   */
  formatRate(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value);
  }

  /**
   * Formatira datum i vreme poslednjeg ažuriranja.
   * Format: dd.MM.yyyy. u HH:mm (npr. 03.04.2025. u 14:32)
   */
  formatDateTime(date: Date): string {
    const d   = String(date.getDate()).padStart(2, '0');
    const m   = String(date.getMonth() + 1).padStart(2, '0');
    const y   = date.getFullYear();
    const h   = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${d}.${m}.${y}. u ${h}:${min}`;
  }
}
