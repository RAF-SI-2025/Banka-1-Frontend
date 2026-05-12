/**
 * NavManifest — deklarativna definicija leve navigacione strukture.
 *
 * PR_31 Task 4: izvor istine za SidebarComponent (Task 6) i CommandPaletteComponent (Task 8).
 * Permisije (`requiredPermissions`, `hideFor`) se uparuju sa onim sto vraca
 * `AuthService.getLoggedUser().permissions` (uppercase stringovi koje izdaje backend
 * iz `LoginResponse.permissions` ili JWT claim-a). `requiredPermissions` je OR-set:
 * dovoljna je bar jedna permisija; ako je `requiredPermissions` prazan ili odsutan,
 * item/grupa je vidljiva svima.
 *
 * Rute su poravnate sa `app-routing.module.ts` (proveravano 2026-05-10).
 */

export type NavIcon =
  | 'home'
  | 'wallet'
  | 'send'
  | 'creditcard'
  | 'piggybank'
  | 'trendingup'
  | 'briefcase'
  | 'handshake'
  | 'building'
  | 'users'
  | 'shieldcheck'
  | 'receipt'
  | 'gauge';

export interface NavItem {
  label: string;
  route: string;
  icon: NavIcon;
  /** OR-set: ako korisnik ima BAR JEDNU od ovih permisija, item je vidljiv. */
  requiredPermissions?: string[];
  /** HIDE-set: ako korisnik ima BAR JEDNU od ovih permisija, item je SAKRIVEN. */
  hideFor?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  requiredPermissions?: string[];
}

/**
 * Glavni manifest. Rute su sinhronizovane sa `app-routing.module.ts`:
 *  - `/accounts/payment/new` (NewPaymentComponent), `/transfers/same`, `/exchange`
 *  - `/home/cards` je lazy-loaded ruta unutar ClientModule (`client-routing.module.ts`)
 *  - admin rute: `/account-management`, `/actuary-management`, `/orders-overview`,
 *    `/tax-tracking`, `/loan-management`, `/funds/profit-banke`, `/funds/profit-aktuara`
 */
export const NAV_MANIFEST: NavGroup[] = [
  {
    /* Klijent flow — gate-ujemo po ROLI ('CLIENT' regular ili 'CLIENT_TRADING') NE po
       BANKING_BASIC permisiji. Razlog: admin/aktuari/basic-employee TAKOĐE imaju
       BANKING_BASIC u JWT-u (kako bi mogli da gledaju klijent rute za potrebe testa),
       ali nisu klijenti banke. Role-based gating ih prirodno isključuje bez hideFor. */
    label: 'Bankarstvo',
    items: [
      { label: 'Pocetna',                  route: '/home',                  icon: 'home',       requiredPermissions: ['CLIENT', 'CLIENT_TRADING'] },
      { label: 'Racuni',                   route: '/accounts',              icon: 'wallet',     requiredPermissions: ['CLIENT', 'CLIENT_TRADING'] },
      { label: 'Placanja',                 route: '/accounts/payment/new',  icon: 'send',       requiredPermissions: ['CLIENT', 'CLIENT_TRADING'] },
      { label: 'Transfer (ista valuta)',   route: '/transfers/same',        icon: 'send',       requiredPermissions: ['CLIENT', 'CLIENT_TRADING'] },
      { label: 'Transfer (razl. valute)',  route: '/transfers/different',   icon: 'trendingup', requiredPermissions: ['CLIENT', 'CLIENT_TRADING'] },
      { label: 'Menjacnica',               route: '/exchange',              icon: 'trendingup', requiredPermissions: ['CLIENT', 'CLIENT_TRADING'] },
      { label: 'Kartice',                  route: '/home/cards',            icon: 'creditcard', requiredPermissions: ['CLIENT', 'CLIENT_TRADING'] },
      { label: 'Krediti',                  route: '/loans',                 icon: 'piggybank',  requiredPermissions: ['CLIENT', 'CLIENT_TRADING'] },
    ],
  },
  {
    /* Berza — trading klijenti (CLIENT_TRADING), aktuari agenti (SECURITIES_TRADE_LIMITED),
       supervizori (TRADE_UNLIMITED/SECURITIES_TRADE_UNLIMITED), admin. */
    label: 'Berza',
    items: [
      { label: 'Hartije od vrednosti', route: '/securities',  icon: 'trendingup', requiredPermissions: ['SECURITIES_TRADE_UNLIMITED', 'SECURITIES_TRADE_LIMITED', 'TRADE_UNLIMITED', 'CLIENT_TRADING'] },
      { label: 'Moj portfolio',        route: '/portfolio',   icon: 'briefcase',  requiredPermissions: ['SECURITIES_TRADE_UNLIMITED', 'SECURITIES_TRADE_LIMITED', 'TRADE_UNLIMITED', 'CLIENT_TRADING'] },
      { label: 'Marzni racun',         route: '/margin',      icon: 'gauge',      requiredPermissions: ['SECURITIES_TRADE_UNLIMITED', 'SECURITIES_TRADE_LIMITED', 'TRADE_UNLIMITED', 'CLIENT_TRADING', 'ADMIN'] },
      { label: 'OTC trgovina',         route: '/otc',         icon: 'handshake',  requiredPermissions: ['OTC_TRADE', 'CLIENT_TRADING', 'TRADE_UNLIMITED', 'SECURITIES_TRADE_UNLIMITED', 'SUPERVISOR', 'ADMIN'] },
      { label: 'Fondovi',              route: '/funds',       icon: 'building',   requiredPermissions: ['FUND_AGENT_MANAGE', 'CLIENT_TRADING', 'TRADE_UNLIMITED', 'SECURITIES_TRADE_UNLIMITED', 'SUPERVISOR', 'ADMIN'] },
    ],
  },
  {
    /* Permisije usaglašene sa app-routing.module.ts roleGuard `data.permission`/`data.roles`.
       Basic employee (CLIENT_MANAGE only) vidi Klijenti + Racuni + Krediti + Zahtevi za kredit. */
    label: 'Administracija',
    items: [
      { label: 'Klijenti',          route: '/clients',                   icon: 'users',       requiredPermissions: ['CLIENT_MANAGE', 'EMPLOYEE_MANAGE_ALL', 'ADMIN'] },
      { label: 'Novi racun',        route: '/accounts/new',              icon: 'wallet',      requiredPermissions: ['CLIENT_MANAGE', 'EMPLOYEE_MANAGE_ALL', 'ADMIN'] },
      { label: 'Zaposleni',         route: '/employees',                 icon: 'users',       requiredPermissions: ['EMPLOYEE_MANAGE_ALL', 'ADMIN'] },
      { label: 'Racuni',            route: '/account-management',        icon: 'wallet',      requiredPermissions: ['CLIENT_MANAGE', 'EMPLOYEE_MANAGE_ALL', 'ADMIN'] },
      { label: 'Aktuari',           route: '/actuary-management',        icon: 'shieldcheck', requiredPermissions: ['FUND_AGENT_MANAGE', 'EMPLOYEE_MANAGE_ALL', 'ADMIN'] },
      { label: 'Pregled order',     route: '/orders-overview',           icon: 'receipt',     requiredPermissions: ['TRADE_UNLIMITED', 'EMPLOYEE_MANAGE_ALL', 'ADMIN'] },
      { label: 'Porez tracking',    route: '/tax-tracking',              icon: 'receipt',     requiredPermissions: ['TRADE_UNLIMITED', 'EMPLOYEE_MANAGE_ALL', 'ADMIN', 'SUPERVISOR'] },
      { label: 'Krediti admin',     route: '/loan-management',           icon: 'piggybank',   requiredPermissions: ['CLIENT_MANAGE', 'EMPLOYEE_MANAGE_ALL', 'ADMIN'] },
      { label: 'Kartice',           route: '/cards-management',          icon: 'creditcard',  requiredPermissions: ['CLIENT_MANAGE', 'EMPLOYEE_MANAGE_ALL', 'ADMIN'] },
      { label: 'Zahtevi za kredit', route: '/loan-request-management',   icon: 'piggybank',   requiredPermissions: ['CLIENT_MANAGE', 'EMPLOYEE_MANAGE_ALL', 'ADMIN'] },
      { label: 'Lista berzi',       route: '/stock-exchange',            icon: 'trendingup',  requiredPermissions: ['ADMIN', 'SUPERVISOR'] },
      { label: 'Profit banke',      route: '/funds/profit-banke',        icon: 'briefcase',   requiredPermissions: ['FUND_AGENT_MANAGE', 'EMPLOYEE_MANAGE_ALL', 'ADMIN'] },
      { label: 'Profit aktuara',    route: '/funds/profit-aktuara',      icon: 'briefcase',   requiredPermissions: ['FUND_AGENT_MANAGE', 'EMPLOYEE_MANAGE_ALL', 'ADMIN'] },
    ],
  },
];

/**
 * Filtrira manifest po skup-u korisnickih permisija.
 *
 * Pravila:
 *  1. Grupa je vidljiva ako (`requiredPermissions` prazan) ili korisnik ima bar
 *     jednu od `requiredPermissions` permisija.
 *  2. Item je vidljiv ako (`requiredPermissions` prazan ili korisnik ima bar jednu)
 *     I (`hideFor` prazan ili korisnik NEMA nijednu od `hideFor`).
 *  3. Grupa se uklanja iz rezultata ako joj posle filtera nije ostao nijedan item.
 *
 * Vraca novi niz/objekte (immutable input — bezbedno za reuse iz Angular templates).
 */
export function filterNavByPermissions(
  manifest: NavGroup[],
  userPerms: string[],
): NavGroup[] {
  const userSet = new Set(userPerms);
  const hasAny = (req?: string[]): boolean =>
    !req || req.length === 0 || req.some((p) => userSet.has(p));
  const hasNoneOf = (hide?: string[]): boolean =>
    !hide || hide.length === 0 || !hide.some((p) => userSet.has(p));
  return manifest
    .filter((g) => hasAny(g.requiredPermissions))
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => hasAny(i.requiredPermissions) && hasNoneOf(i.hideFor),
      ),
    }))
    .filter((g) => g.items.length > 0);
}
