export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type CurrencyCode = 'RSD' | 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY' | 'CAD' | 'AUD';

/**
 * Podvrste tekućeg računa (lični i poslovni)
 * Tip account broja - poslednje 2 cifre:
 * 11=Lični standardni, 13=Štedni, 14=Penzionerski, 15=Za mlade, 16=Za studente, 17=Za nezaposlene
 * 12=Poslovni (DOO, AD, Fondacija)
 * 21=Devizni lični, 22=Devizni poslovni
 */
export type AccountSubtype =
  | 'STANDARD'
  | 'SAVINGS'
  | 'PENSION'
  | 'YOUTH'
  | 'STUDENT'
  | 'UNEMPLOYED'
  | 'DOO'
  | 'AD'
  | 'FOUNDATION'
  | 'FOREIGN_PERSONAL'
  | 'FOREIGN_BUSINESS';

export interface Account {
  id: number;
  /** Naziv računa, može se menjati */
  name: string;
  /** 18-cifreni broj računa */
  accountNumber: string;
  /** Stanje računa */
  balance: number;
  /** Raspoloživo stanje = stanje - rezervisana sredstva */
  availableBalance: number;
  /** Rezervisana sredstva (nastaju kod međubankarskih transakcija) */
  reservedFunds: number;
  /** Valuta: RSD za tekući, strana valuta za devizni */
  currency: CurrencyCode;
  /** Da li je račun aktivan */
  status: AccountStatus;
  /** Podvrsta računa */
  subtype: AccountSubtype;
  /** ID vlasnika (klijenta) */
  ownerId: number;
  /** Ime i prezime vlasnika */
  ownerName: string;
  /** ID zaposlenog koji je kreirao račun */
  employeeId: number;
  /** Mesečna naknada za održavanje */
  maintenanceFee: number;
  /** Maksimalni dnevni iznos transakcija */
  dailyLimit: number;
  /** Maksimalni mesečni iznos transakcija */
  monthlyLimit: number;
  /** Ukupno potrošeno danas */
  dailySpending: number;
  /** Ukupno potrošeno ovog meseca */
  monthlySpending: number;
  /** Datum kreiranja */
  createdAt: string;
  /** Datum isteka */
  expiryDate: string;
}
