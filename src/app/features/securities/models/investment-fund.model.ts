export type FundPerformancePeriod = 'monthly' | 'quarterly' | 'yearly';

export interface FundSecurityHolding {
  id: number;
  ticker: string;
  price: number;
  change: number;
  volume: number;
  initialMarginCost: number;
  acquisitionDate: string;
}

export interface FundPerformancePoint {
  date: string;
  value: number;
  profit: number;
}

export interface InvestmentFundDetail {
  id: number;
  name: string;
  description: string;
  managerName: string;
  fundValue: number;
  minimumContribution: number;
  profit: number;
  accountNumber: string;
  liquidity: number;
  securities: FundSecurityHolding[];
  performance: Record<FundPerformancePeriod, FundPerformancePoint[]>;
}
