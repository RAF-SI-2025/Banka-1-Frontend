export type PortfolioListingType = 'STOCK' | 'FUTURES' | 'FOREX' | 'OPTION';

export interface PortfolioHolding {
  id?: number;
  listingId: number;
  listingType: PortfolioListingType;
  ticker: string;
  quantity: number;
  publicQuantity: number;
  exercisable: boolean | null;
  lastModified: string;
  currentPrice: number;
  averagePurchasePrice: number;
  profit: number;
}

export interface PortfolioSummary {
  holdings: PortfolioHolding[];
  totalProfit: number;
  yearlyTaxPaid: number;
  monthlyTaxDue: number;
}

export interface SetPublicQuantityRequest {
  publicQuantity: number;
}

/** F10: jedna isplata dividende po poziciji u portfoliju. */
export interface DividendPayout {
  id?: number;
  /** Datum isplate (ISO ili YYYY-MM-DD). */
  payoutDate: string;
  /** Iznos isplate. */
  amount: number;
  /** Valuta isplate (npr. RSD, USD, EUR). */
  currency: string;
}

/** F10: odgovor GET /order/portfolio/{portfolioId}/dividends */
export interface DividendHistoryResponse {
  payouts: DividendPayout[];
  /** Ukupno primljene dividende (ako backend agregira). */
  totalReceived?: number;
  /** Valuta za totalReceived (podrazumevano iz payouts). */
  currency?: string;
}
