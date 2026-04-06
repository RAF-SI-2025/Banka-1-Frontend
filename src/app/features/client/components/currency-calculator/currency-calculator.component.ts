import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExchangeRate, ExchangeRateService, SUPPORTED_CURRENCIES } from '../../services/exchange-rate.service';

/**
 * Reusable kalkulator menjačnice.
 * Koristi se kao tab u ExchangeRateComponent i kao widget na početnoj stranici.
 * Ako su kursevi prosleđeni kroz @Input(), ne pravi dodatni API poziv.
 */
@Component({
  selector: 'app-currency-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './currency-calculator.component.html',
  styleUrls: ['./currency-calculator.component.scss']
})
export class CurrencyCalculatorComponent implements OnInit, OnChanges {

  /** Kursevi prosleđeni od parent komponente (opciono) */
  @Input() rates: ExchangeRate[] = [];

  /** Datum poslednjeg ažuriranja kurseva */
  @Input() lastUpdated: Date | null = null;

  allCurrencies = ['RSD', ...SUPPORTED_CURRENCIES];

  fromCurrency = 'EUR';
  toCurrency   = 'RSD';
  amount: number | null = null;

  result:    number | null = null;
  usedRate:  number | null = null;
  rateLabel  = '';

  isLoading = false;
  error: string | null = null;

  constructor(private exchangeRateService: ExchangeRateService) {}

  ngOnInit(): void {
    if (this.rates.length === 0) {
      this.loadRates();
    } else {
      this.updateRateLabel();
    }
  }

  ngOnChanges(): void {
    if (this.rates.length > 0) {
      this.updateRateLabel();
    }
  }

  /**
   * Dohvata kurseve direktno ako nisu prosleđeni kroz @Input().
   * Koristi isti keširani poziv iz ExchangeRateService.
   */
  private loadRates(): void {
    this.isLoading = true;
    this.exchangeRateService.getRates().subscribe({
      next: res => {
        this.rates       = res.rates;
        this.lastUpdated = res.lastUpdated;
        this.isLoading   = false;
        this.updateRateLabel();
      },
      error: () => {
        this.error     = 'Greška pri učitavanju kurseva.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Reaguje na promenu "Iz valute".
   * Ako su obe valute iste, automatski menja "U valutu".
   */
  onFromCurrencyChange(): void {
    if (this.fromCurrency === this.toCurrency) {
      this.toCurrency = this.fromCurrency === 'RSD' ? 'EUR' : 'RSD';
    }
    this.result = null;
    this.updateRateLabel();
  }

  /**
   * Reaguje na promenu "U valutu".
   * Ako su obe valute iste, automatski menja "Iz valute".
   */
  onToCurrencyChange(): void {
    if (this.toCurrency === this.fromCurrency) {
      this.fromCurrency = this.toCurrency === 'RSD' ? 'EUR' : 'RSD';
    }
    this.result = null;
    this.updateRateLabel();
  }

  /**
   * Zamenjuje fromCurrency i toCurrency.
   */
  swap(): void {
    [this.fromCurrency, this.toCurrency] = [this.toCurrency, this.fromCurrency];
    this.result = null;
    this.updateRateLabel();
  }

  /**
   * Pokreće konverziju iznosa.
   * Logika konverzije je u ExchangeRateService.convert().
   */
  calculate(): void {
    if (!this.amount || this.amount <= 0 || this.rates.length === 0) return;
    const { result, usedRate } = this.exchangeRateService.convert(
      this.amount, this.fromCurrency, this.toCurrency, this.rates
    );
    this.result   = result;
    this.usedRate = usedRate;
  }

  /**
   * Ažurira prikaz prodajnog kursa ispod dropdowna.
   * Format zavisi od kombinacije valuta:
   * - strana → RSD: "1 EUR = 117,6926 RSD"
   * - RSD → strana: "1 RSD = 0,0085 EUR"
   * - strana → strana: "Prodajni kurs: 1 USD = 102,0380 RSD"
   */
  private updateRateLabel(): void {
    if (this.rates.length === 0) return;

    if (this.fromCurrency === this.toCurrency) {
      this.rateLabel = `1 ${this.fromCurrency} = 1 ${this.toCurrency}`;
      return;
    }

    if (this.toCurrency === 'RSD') {
      const rate = this.rates.find(r => r.currency === this.fromCurrency);
      this.rateLabel = rate ? `1 ${this.fromCurrency} = ${this.formatRate(rate.sellRate)} RSD` : '';
    } else if (this.fromCurrency === 'RSD') {
      const rate = this.rates.find(r => r.currency === this.toCurrency);
      this.rateLabel = rate ? `1 RSD = ${this.formatRate(1 / rate.sellRate)} ${this.toCurrency}` : '';
    } else {
      const to = this.rates.find(r => r.currency === this.toCurrency);
      this.rateLabel = to ? `Prodajni kurs: 1 ${this.toCurrency} = ${this.formatRate(to.sellRate)} RSD` : '';
    }
  }

  /**
   * Formatira rezultat konverzije na 2 decimale u srpskom formatu.
   */
  formatResult(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Formatira kurs na 4 decimale u srpskom formatu.
   */
  formatRate(value: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value);
  }

  /**
   * Vraća true ako su svi uslovi za kalkulaciju ispunjeni.
   */
  get canCalculate(): boolean {
    return !!this.amount && this.amount > 0 && this.rates.length > 0;
  }
}
