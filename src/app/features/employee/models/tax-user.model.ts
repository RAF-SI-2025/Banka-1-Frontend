export interface TaxUser {
  id: number;
  firstName: string;
  lastName: string;
  type: 'CLIENT' | 'ACTUARY';
  baseAmount: number; 
  taxDebt: number;  
}