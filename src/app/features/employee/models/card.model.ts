export type CardStatus = 'AKTIVNA' | 'BLOKIRANA' | 'DEAKTIVIRANA';

export type CardAction = 'BLOCK' | 'UNBLOCK' | 'DEACTIVATE';

export interface Card {
  id: number;
  cardNumber: string;
  cardType: string; // Visa, MasterCard, etc.
  cardName: string; // "Visa online debit", "Visa Virtual", etc.
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  status: CardStatus;
  accountNumber: string;
  balance: number;
  currency: string;
}

export const CardStatusLabels: Record<CardStatus, string> = {
  AKTIVNA: 'Aktivna',
  BLOKIRANA: 'Blokirana',
  DEAKTIVIRANA: 'Deaktivirana'
};
