export interface TaxUser {
  firstName: string;
  lastName: string;
  userType: 'CLIENT' | 'ACTUARY';
  taxDebtRsd: number;
  lastTaxCalculationDate: string | null;
  currentMonthTaxRsd: number;
  totalPaidTaxRsd: number;
  status: 'ACTIVE' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'FAILED';
}

export interface TaxUserDisplay {
  firstName: string;
  lastName: string;
  type: 'CLIENT' | 'ACTUARY';
  baseAmount: number;
  taxDebt: number;
  lastTaxCalculationDate: string | null;
  currentMonthTax: number;
  totalPaidTax: number;
  status: 'ACTIVE' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'FAILED';
}

export interface TaxUserPage {
  content: TaxUser[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
