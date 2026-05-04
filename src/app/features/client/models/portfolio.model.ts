export type PortfolioListingType = 'STOCK' | 'FUTURES' | 'FOREX' | 'OPTION';

export interface PortfolioHolding {
  id?: number;
  /**
   * ID of the underlying listing/security. Required to navigate from "Moj Portfolio"
   * into the Create Order page in SELL mode (issue #199); previously the response did
   * not include it, which is why the Sell button did nothing.
   */
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
