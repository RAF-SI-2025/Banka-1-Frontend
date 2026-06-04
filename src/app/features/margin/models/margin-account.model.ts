// PR_03 C3.8: TypeScript modeli za marzne racune.
// Spec: Marzni_Racuni.txt — DTO oblika definisani u backend banking-core-service-u.

export interface MarginAccountResponse {
  userId?: number;
  companyId?: number;
  accountNumber: string;
  initialMargin: number;
  loanValue: number;
  maintenanceMargin: number;
  bankParticipation: number;
  active: boolean;
}

export interface CreateUserMarginAccountRequest {
  employeeId: number;
  userId: number;
  initialMargin: number;
  maintenanceMargin: number;
  bankParticipation: number;
}

export interface CreateCompanyMarginAccountRequest {
  employeeId: number;
  companyId: number;
  initialMargin: number;
  maintenanceMargin: number;
  bankParticipation: number;
}

export interface MarginTransferRequest {
  amount: number;
}

export interface StockMarginTransactionRequest {
  userId?: number;
  companyId?: number;
  amount: number;
}

export type MarginTransactionType =
  | 'STOCK_BUY'
  | 'STOCK_SELL'
  | 'ADD_TO_MARGIN'
  | 'WITHDRAW_FROM_MARGIN';

export interface MarginTransactionHistoryItem {
  id: number;
  accountNumber: string;
  amount: number;
  transactionType: MarginTransactionType;
  occurredAt: string;
  description: string;
}
