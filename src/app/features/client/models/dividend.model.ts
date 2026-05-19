/**
 * WP-24 (Celina 3 — Isplata dividendi).
 *
 * Ogledalo trading-service `DividendPayout` DTO-a koji vraca
 * `GET /dividends` (i `GET /dividends?listingId={id}`). Svaki red je jedna
 * isplata dividende za jednu poziciju (akciju) korisnika: bruto iznos u valuti
 * hartije, porez konvertovan u RSD i neto iznos koji je legao na racun.
 *
 * `forBank` je true ako je dividenda isplacena za poziciju koju banka drzi za
 * sopstveni racun (a ne klijent) — za "Moj portfolio" prikaz uvek je false,
 * ali polje se mapira radi vernosti DTO-u.
 */
export interface DividendPayout {
  id: number;
  userId: number;
  stockTicker: string;
  listingId: number;
  quantity: number;
  grossAmount: number;
  currency: string;
  taxAmountRsd: number;
  netAmount: number;
  accountId: number;
  paymentDate: string;
  forBank: boolean;
}
