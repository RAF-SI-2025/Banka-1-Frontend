export type PortfolioListingType = 'STOCK' | 'FUTURES' | 'FOREX' | 'OPTION';

export interface PortfolioHolding {
  id?: number;
  /**
   * Identifier of the underlying security listing. Required by the SELL flow
   * to navigate to a direction-specific Create Order route; without it the
   * portfolio row carries no usable target for navigation.
   */
  listingId?: number;
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
