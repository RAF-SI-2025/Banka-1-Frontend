export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type TransactionType = 'PAYMENT' | 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL';

export interface Transaction {
  /** ID transakcije */
  id: number;
  /** ID računa sa kojeg je transakcija */
  fromAccountId: number;
  /** Broj računa sa kojeg je transakcija */
  fromAccountNumber: string;
  /** Broj računa primaoca */
  toAccountNumber: string;
  /** Ime primaoca */
  recipientName: string;
  /** Iznos transakcije */
  amount: number;
  /** Valuta */
  currency: string;
  /** Status transakcije */
  status: TransactionStatus;
  /** Opis / svrha plaćanja */
  description: string;
  /** Datum kreiranja */
  createdAt: string;
  /** Tip transakcije */
  type: TransactionType;
}

export interface TransactionPage {
  content: Transaction[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
