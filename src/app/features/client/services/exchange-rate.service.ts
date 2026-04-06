import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

export interface ExchangeRate {
  currency: string;
  name: string;
  flag: string;
  buyRate: number;
  sellRate: number;
  middleRate: number;
}

export interface ExchangeRatesResult {
  rates: ExchangeRate[];
  lastUpdated: Date;
}

// TODO: uskladiti tačnu vrednost sa backend timom
const SELL_COMMISSION = 0.01;
const BUY_COMMISSION  = 0.01;

const CURRENCY_META: Record<string, { name: string; flag: string }> = {
  EUR: { name: 'Euro',               flag: '🇪🇺' },
  CHF: { name: 'Švajcarski franak',  flag: '🇨🇭' },
  USD: { name: 'Američki dolar',     flag: '🇺🇸' },
  GBP: { name: 'Funta sterlinga',    flag: '🇬🇧' },
  JPY: { name: 'Japanski jen',       flag: '🇯🇵' },
  CAD: { name: 'Kanadski dolar',     flag: '🇨🇦' },
  AUD: { name: 'Australijski dolar', flag: '🇦🇺' },
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_META);

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {

  private readonly API_URL = 'https://open.er-api.com/v6/latest/RSD';

  /** Keširani rezultat da se ne pravi dupli API poziv */
  private cache$: Observable<ExchangeRatesResult> | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Dohvata kurseve sa eksternog API servisa.
   * Rezultat se kešira tokom sesije (shareReplay).
   */
  getRates(): Observable<ExchangeRatesResult> {
    if (!this.cache$) {
      this.cache$ = this.http.get<any>(this.API_URL).pipe(
        map(res => this.mapResponse(res)),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  /**
   * Mapira API odgovor u interni model.
   * API vraća kurseve u obliku: 1 RSD = X strana valuta.
   * Middle rate = 1 / API rate (koliko RSD košta 1 strana valuta).
   * Kupovni kurs = middleRate * (1 - provizija)
   * Prodajni kurs = middleRate * (1 + provizija)
   */
  private mapResponse(res: any): ExchangeRatesResult {
    const ratesInRSD: Record<string, number> = res.rates;

    const rates: ExchangeRate[] = SUPPORTED_CURRENCIES.map(code => {
      const middleRate = 1 / ratesInRSD[code];
      const sellRate   = middleRate * (1 + SELL_COMMISSION);
      const buyRate    = middleRate * (1 - BUY_COMMISSION);
      return {
        currency: code,
        name:     CURRENCY_META[code].name,
        flag:     CURRENCY_META[code].flag,
        buyRate,
        sellRate,
        middleRate,
      };
    });

    return {
      rates,
      lastUpdated: new Date(res.time_last_update_utc ?? Date.now()),
    };
  }

  /**
   * Konvertuje iznos iz jedne valute u drugu.
   * Banka uvek koristi prodajni kurs za toCurrency.
   * Konverzija između dve strane valute ide kroz RSD:
   *   strana → RSD (kupovni kurs) → strana (prodajni kurs)
   */
  convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: ExchangeRate[]
  ): { result: number; usedRate: number } {
    if (fromCurrency === toCurrency) return { result: amount, usedRate: 1 };

    const find = (code: string) => rates.find(r => r.currency === code)!;

    if (fromCurrency === 'RSD') {
      const to = find(toCurrency);
      return { result: amount / to.sellRate, usedRate: to.sellRate };
    }

    if (toCurrency === 'RSD') {
      const from = find(fromCurrency);
      return { result: amount * from.buyRate, usedRate: from.buyRate };
    }

    // Strana → Strana: kroz RSD
    const from  = find(fromCurrency);
    const to    = find(toCurrency);
    const inRSD = amount * from.buyRate;
    return { result: inRSD / to.sellRate, usedRate: to.sellRate };
  }
}
