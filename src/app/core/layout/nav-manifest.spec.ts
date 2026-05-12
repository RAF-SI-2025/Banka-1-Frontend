import { NAV_MANIFEST, filterNavByPermissions } from './nav-manifest';

/** Capability set helpers — mirror sidebar.component.ts (perms + role string). */
const cap = (perms: string[], role?: string): string[] => role ? [...perms, role] : perms;

describe('NavManifest', () => {
  it('manifest ima 3 grupe: Bankarstvo, Berza, Administracija', () => {
    const labels = NAV_MANIFEST.map(g => g.label);
    expect(labels).toEqual(['Bankarstvo', 'Berza', 'Administracija']);
  });

  it('prazne capabilities → ne vidi nista', () => {
    expect(filterNavByPermissions(NAV_MANIFEST, []).length).toBe(0);
  });

  describe('Regular klijent (role=CLIENT, perms=[BANKING_BASIC])', () => {
    const c = cap(['BANKING_BASIC'], 'CLIENT');
    it('vidi Bankarstvo sa svih 8 stavki', () => {
      const f = filterNavByPermissions(NAV_MANIFEST, c);
      const ba = f.find(g => g.label === 'Bankarstvo');
      expect(ba?.items.length).toBe(8);
      const routes = ba!.items.map(i => i.route);
      expect(routes).toContain('/home');
      expect(routes).toContain('/loans');
      expect(routes).toContain('/transfers/different');
    });
    it('NE vidi Berza i Administracija', () => {
      const labels = filterNavByPermissions(NAV_MANIFEST, c).map(g => g.label);
      expect(labels).not.toContain('Berza');
      expect(labels).not.toContain('Administracija');
    });
  });

  describe('Trading klijent (role=CLIENT_TRADING, perms=[BANKING_BASIC])', () => {
    const c = cap(['BANKING_BASIC'], 'CLIENT_TRADING');
    it('vidi Bankarstvo + Berza, NE Administracija', () => {
      const labels = filterNavByPermissions(NAV_MANIFEST, c).map(g => g.label);
      expect(labels).toContain('Bankarstvo');
      expect(labels).toContain('Berza');
      expect(labels).not.toContain('Administracija');
    });
    it('Berza ima svih 5 stavki (akcije/portfolio/margin/OTC/fondovi)', () => {
      const f = filterNavByPermissions(NAV_MANIFEST, c);
      const berza = f.find(g => g.label === 'Berza');
      expect(berza?.items.length).toBe(5);
    });
  });

  describe('Basic employee (role=BASIC, perms=[BANKING_BASIC, CLIENT_MANAGE])', () => {
    const c = cap(['BANKING_BASIC', 'CLIENT_MANAGE'], 'BASIC');
    it('NE vidi Bankarstvo (role-gated)', () => {
      const labels = filterNavByPermissions(NAV_MANIFEST, c).map(g => g.label);
      expect(labels).not.toContain('Bankarstvo');
    });
    it('NE vidi Berza (nema trading permisiju)', () => {
      const labels = filterNavByPermissions(NAV_MANIFEST, c).map(g => g.label);
      expect(labels).not.toContain('Berza');
    });
    it('vidi Administracija sa 4 stavke (Klijenti, Racuni, Krediti admin, Zahtevi)', () => {
      const f = filterNavByPermissions(NAV_MANIFEST, c);
      const adm = f.find(g => g.label === 'Administracija');
      expect(adm).toBeDefined();
      const routes = adm!.items.map(i => i.route);
      expect(routes).toContain('/clients');
      expect(routes).toContain('/account-management');
      expect(routes).toContain('/loan-management');
      expect(routes).toContain('/loan-request-management');
      expect(routes).not.toContain('/employees');
      expect(routes).not.toContain('/funds/profit-banke');
    });
  });

  describe('Aktuar agent (role=BASIC, perms=[BANKING_BASIC, SECURITIES_TRADE_LIMITED])', () => {
    const c = cap(['BANKING_BASIC', 'SECURITIES_TRADE_LIMITED'], 'BASIC');
    it('vidi Berza (trading) i sakriva Bankarstvo i Administracija (samo BASIC role)', () => {
      const labels = filterNavByPermissions(NAV_MANIFEST, c).map(g => g.label);
      expect(labels).toContain('Berza');
      expect(labels).not.toContain('Bankarstvo');
      expect(labels).not.toContain('Administracija');
    });
  });

  describe('Supervizor (role=SUPERVISOR, perms=[BANKING_BASIC, TRADE_UNLIMITED, SECURITIES_TRADE_UNLIMITED, OTC_TRADE, FUND_AGENT_MANAGE, CLIENT_MANAGE])', () => {
    const c = cap(['BANKING_BASIC', 'TRADE_UNLIMITED', 'SECURITIES_TRADE_UNLIMITED', 'OTC_TRADE', 'FUND_AGENT_MANAGE', 'CLIENT_MANAGE'], 'SUPERVISOR');
    it('NE vidi Bankarstvo, vidi Berza + Administracija', () => {
      const labels = filterNavByPermissions(NAV_MANIFEST, c).map(g => g.label);
      expect(labels).not.toContain('Bankarstvo');
      expect(labels).toContain('Berza');
      expect(labels).toContain('Administracija');
    });
    it('Administracija ukljucuje Aktuari, Pregled order, Porez, Profit banke/aktuara, Kursna lista', () => {
      const f = filterNavByPermissions(NAV_MANIFEST, c);
      const adm = f.find(g => g.label === 'Administracija');
      const routes = adm!.items.map(i => i.route);
      expect(routes).toContain('/actuary-management');
      expect(routes).toContain('/orders-overview');
      expect(routes).toContain('/tax-tracking');
      expect(routes).toContain('/funds/profit-banke');
      expect(routes).toContain('/funds/profit-aktuara');
      expect(routes).toContain('/stock-exchange');
      expect(routes).not.toContain('/employees'); /* supervizor != admin */
    });
  });

  describe('Admin (role=ADMIN, perms=[sve gore + EMPLOYEE_MANAGE_ALL])', () => {
    const c = cap(['BANKING_BASIC', 'TRADE_UNLIMITED', 'SECURITIES_TRADE_UNLIMITED', 'SECURITIES_TRADE_LIMITED', 'OTC_TRADE', 'FUND_AGENT_MANAGE', 'CLIENT_MANAGE', 'EMPLOYEE_MANAGE_ALL'], 'ADMIN');
    it('NE vidi Bankarstvo, vidi Berza + Administracija sa svim 11 stavki', () => {
      const f = filterNavByPermissions(NAV_MANIFEST, c);
      expect(f.find(g => g.label === 'Bankarstvo')).toBeUndefined();
      const berza = f.find(g => g.label === 'Berza');
      expect(berza?.items.length).toBe(5);
      const adm = f.find(g => g.label === 'Administracija');
      expect(adm?.items.length).toBe(11);
      const routes = adm!.items.map(i => i.route);
      expect(routes).toContain('/employees');
    });
  });
});
