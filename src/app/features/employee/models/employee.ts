export interface Employee {
  id?: number;
  ime: string;
  prezime: string;
  datumRodjenja: string; // Format: "YYYY-MM-DD"
  pol: string;           // "M" ili "Z"
  email: string;
  brojTelefona: string;
  adresa?: string;
  pozicija?: string;
  departman?: string;
  aktivan?: boolean;
  permisije?: string[];
}