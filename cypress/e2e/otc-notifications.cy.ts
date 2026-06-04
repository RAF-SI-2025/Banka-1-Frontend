/**
 * Celina 4 / F11: OTC notifikacije — test po test (mock API, bez backend-a).
 *
 * Zahtev: `npm start` sa najnovijim kodom (topbar data-testid=notification-bell).
 *
 * Poll interval u E2E: 5000 ms (dev minimum) — ne 500 ms (previše agresivno).
 * Produkcija uvek koristi 30 s, `__OTC_POLL_MS` se ignoriše u production build-u.
 */

/** Usklađeno sa OTC_NOTIFICATION_POLL_MS_DEV_MIN u monitor servisu. */
const E2E_OTC_POLL_MS = 5000;

const MOCK_JWT_BUYER =
  'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const OTC_USER = {
  email: 'otc.test@banka.com',
  permissions: ['CLIENT_TRADING'],
};

const BASE_OFFER = {
  id: 1,
  stockTicker: 'AAPL',
  buyerId: 77,
  sellerId: 88,
  amount: 10,
  pricePerStock: 150,
  premium: 400,
  settlementDate: '2027-12-31',
  modifiedBy: '77',
  lastModified: '2026-05-01T10:00:00',
};

function settlementInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().substring(0, 10);
}

function stubOtcMonitor(): void {
  cy.intercept('GET', '**/api/interbank/otc/negotiations', {
    statusCode: 200,
    body: [],
  });
  cy.intercept('GET', '**/otc/contracts/my**', {
    statusCode: 200,
    body: [],
  }).as('contractsActive');
  cy.intercept('GET', '**/otc/offers/active', {
    statusCode: 200,
    body: [{ ...BASE_OFFER, status: 'PENDING_SELLER' }],
  }).as('offersActive');
}

function stubHomePage(): void {
  cy.intercept('GET', '**/accounts/client/accounts*', {
    statusCode: 200,
    body: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 },
  });
  cy.intercept('GET', '**/exchange/rates*', {
    statusCode: 200,
    body: [],
  });
}

function stubOtcPortal(): void {
  cy.intercept('GET', '**/otc/public-stocks', {
    statusCode: 200,
    body: [],
  });
}

function visitHome(): void {
  cy.visit('/home', {
    onBeforeLoad(win) {
      win.__OTC_POLL_MS = E2E_OTC_POLL_MS;
      win.localStorage.setItem('authToken', MOCK_JWT_BUYER);
      win.localStorage.setItem('loggedUser', JSON.stringify(OTC_USER));
    },
  });
}

function visitOtc(): void {
  cy.visit('/otc', {
    onBeforeLoad(win) {
      win.__OTC_POLL_MS = E2E_OTC_POLL_MS;
      win.localStorage.setItem('authToken', MOCK_JWT_BUYER);
      win.localStorage.setItem('loggedUser', JSON.stringify(OTC_USER));
    },
  });
}

/** Prvi kompletan poll (offers + contracts). */
function waitInitialMonitorPoll(): void {
  cy.wait('@offersActive', { timeout: 20000 });
  cy.wait('@contractsActive', { timeout: 20000 });
}

/** Sledeći poll ponuda (2. GET na offers/active). Sa exhaustMap u monitoru može biti posle 5–10s. */
function waitSecondOfferPoll(): void {
  cy.wait('@offersActive', { timeout: 25000 });
}

/** Tri poziva na interbank 500 (initial + 2× retry u OtcService, ~6s). */
function waitInterbank500Retries(): void {
  cy.wait('@negotiations500', { timeout: 20000 });
  cy.wait('@negotiations500', { timeout: 20000 });
  cy.wait('@negotiations500', { timeout: 20000 });
}

describe('OTC notifikacije (F11)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    stubOtcMonitor();
    stubHomePage();
    stubOtcPortal();
  });

  it('1 — otvara zvonce i prikazuje prazan inbox', () => {
    cy.visit('/home', {
      onBeforeLoad(win) {
        win.localStorage.setItem('authToken', MOCK_JWT_BUYER);
        win.localStorage.setItem('loggedUser', JSON.stringify(OTC_USER));
      },
    });

    cy.wait(['@offersActive', '@contractsActive']);

    cy.get('app-topbar').should('be.visible');
    cy.get('app-topbar [data-testid=notification-bell]', { timeout: 5000 })
      .should('exist')
      .and('be.visible')
      .click();

    cy.get('[data-testid=notification-bell]').should('have.attr', 'aria-expanded', 'true');
    cy.get('[data-testid=notification-menu]').should('be.visible');
    cy.contains('[data-testid=notification-menu]', 'Nema novih obaveštenja.').should(
      'be.visible',
    );
  });

  it('2 — kontraponuda: toast i stavka u zvoncu', () => {
    let poll = 0;
    cy.intercept('GET', '**/otc/offers/active', (req) => {
      poll += 1;
      const body =
        poll === 1
          ? [{ ...BASE_OFFER, status: 'PENDING_SELLER', modifiedBy: '77' }]
          : [
              {
                ...BASE_OFFER,
                status: 'PENDING_BUYER',
                pricePerStock: 165,
                modifiedBy: '88',
                lastModified: '2026-05-18T12:00:00',
              },
            ];
      req.reply({ statusCode: 200, body });
    }).as('offersActive');

    visitHome();
    waitInitialMonitorPoll();
    waitSecondOfferPoll();

    cy.contains('.toast-content', 'kontraponudu za AAPL', { timeout: 10000 }).should(
      'be.visible',
    );

    cy.get('[data-testid=notification-bell]').click();
    cy.get('[data-testid=notification-item]')
      .should('contain.text', 'kontraponudu za AAPL')
      .and('be.visible');
  });

  it('3 — prihvaćena ponuda: toast i zvonce', () => {
    let poll = 0;
    cy.intercept('GET', '**/otc/offers/active', (req) => {
      poll += 1;
      const body =
        poll === 1
          ? [{ ...BASE_OFFER, status: 'PENDING_BUYER', modifiedBy: '88' }]
          : [{ ...BASE_OFFER, status: 'ACCEPTED', modifiedBy: '88' }];
      req.reply({ statusCode: 200, body });
    }).as('offersActive');

    visitHome();
    waitInitialMonitorPoll();
    waitSecondOfferPoll();

    cy.contains('.toast-content', 'Ponuda za AAPL je prihvaćena.', { timeout: 10000 }).should(
      'be.visible',
    );

    cy.get('[data-testid=notification-bell]').click();
    cy.get('[data-testid=notification-item]').should(
      'contain.text',
      'Ponuda za AAPL je prihvaćena.',
    );
  });

  it('4 — povučena ponuda: toast i zvonce', () => {
    let poll = 0;
    cy.intercept('GET', '**/otc/offers/active', (req) => {
      poll += 1;
      const body =
        poll === 1
          ? [{ ...BASE_OFFER, status: 'PENDING_SELLER', modifiedBy: '77' }]
          : [];
      req.reply({ statusCode: 200, body });
    }).as('offersActive');

    visitHome();
    waitInitialMonitorPoll();
    waitSecondOfferPoll();

    cy.contains('.toast-content', 'odustala od ponude za AAPL', { timeout: 10000 }).should(
      'be.visible',
    );

    cy.get('[data-testid=notification-bell]').click();
    cy.get('[data-testid=notification-item]').should(
      'contain.text',
      'odustala od ponude za AAPL',
    );
  });

  it('5 — banner za ugovor koji uskoro ističe (OTC portal)', () => {
    const soon = settlementInDays(2);
    cy.intercept('GET', '**/otc/contracts/my**', {
      statusCode: 200,
      body: [
        {
          id: 9,
          offerId: 1,
          stockTicker: 'AAPL',
          buyerId: 77,
          sellerId: 88,
          amount: 10,
          pricePerStock: 150,
          settlementDate: soon,
          status: 'ACTIVE',
          createdAt: '2026-01-01T10:00:00',
        },
      ],
    }).as('contractsTab');

    visitOtc();
    cy.contains('button', 'Izvršeni ugovori').click();
    cy.wait('@contractsTab');

    cy.get('[data-testid=otc-expiry-warning]').should('be.visible');
    cy.contains('[data-testid=otc-expiry-warning]', 'AAPL').should('be.visible');
    cy.contains('[data-testid=otc-expiry-warning]', 'uskoro ističu').should('be.visible');
  });

  it('6 — istek ugovora u inboxu zvona (bez toasta na prvom poll-u)', () => {
    const soon = settlementInDays(2);
    cy.intercept('GET', '**/otc/contracts/my**', {
      statusCode: 200,
      body: [
        {
          id: 9,
          offerId: 1,
          stockTicker: 'AAPL',
          buyerId: 77,
          sellerId: 88,
          amount: 10,
          pricePerStock: 150,
          settlementDate: soon,
          status: 'ACTIVE',
          createdAt: '2026-01-01T10:00:00',
        },
      ],
    }).as('contractsActive');
    cy.intercept('GET', '**/otc/offers/active', {
      statusCode: 200,
      body: [],
    }).as('offersActive');

    visitHome();
    waitInitialMonitorPoll();

    cy.get('.toast-content').should('not.exist');

    cy.get('[data-testid=notification-bell]').click();
    cy.get('[data-testid=notification-item]')
      .should('contain.text', 'Opcioni ugovor za AAPL')
      .and('contain.text', 'ističe');
  });

  describe('greške i otpornost', () => {
    it('7 — API 500 na OTC poll: aplikacija i zvonce rade (fallback na prazan inbox)', () => {
      cy.intercept('GET', '**/api/interbank/otc/negotiations', { statusCode: 500, body: {} });
      cy.intercept('GET', '**/otc/offers/active', { statusCode: 500, body: {} }).as('offers500');
      cy.intercept('GET', '**/otc/contracts/my**', { statusCode: 500, body: {} }).as('contracts500');

      visitHome();
      cy.wait(['@offers500', '@contracts500']);

      cy.get('app-topbar', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid=notification-bell]').should('be.visible').click();
      cy.get('[data-testid=notification-menu]').should('be.visible');
      cy.contains('[data-testid=notification-menu]', 'Nema novih obaveštenja.').should(
        'be.visible',
      );
    });

    it('7b — negotiations 500, lokalne ponude OK: monitor i dalje radi', () => {
      cy.intercept('GET', '**/api/interbank/otc/negotiations', {
        statusCode: 500,
        body: {},
      }).as('negotiations500');

      let poll = 0;
      cy.intercept('GET', '**/otc/offers/active', (req) => {
        poll += 1;
        const body =
          poll === 1
            ? [{ ...BASE_OFFER, status: 'PENDING_SELLER', modifiedBy: '77' }]
            : [
                {
                  ...BASE_OFFER,
                  status: 'PENDING_BUYER',
                  pricePerStock: 165,
                  modifiedBy: '88',
                },
              ];
        req.reply({ statusCode: 200, body });
      }).as('offersActive');

      visitHome();
      cy.wait('@offersActive', { timeout: 20000 });
      waitInterbank500Retries();
      cy.wait('@contractsActive', { timeout: 20000 });

      waitSecondOfferPoll();

      cy.contains('.toast-content', 'kontraponudu za AAPL', { timeout: 15000 }).should(
        'be.visible',
      );
    });

    it('8 — mrežna greška pa uspešan poll: monitor nastavlja bez pada', () => {
      let offerCalls = 0;
      cy.intercept('GET', '**/otc/offers/active', (req) => {
        offerCalls += 1;
        if (offerCalls < 3) {
          req.destroy();
          return;
        }
        req.reply({
          statusCode: 200,
          body: [{ ...BASE_OFFER, status: 'PENDING_SELLER', modifiedBy: '77' }],
        });
      }).as('offersFlaky');

      visitHome();

      cy.wait('@offersFlaky', { timeout: 15000 });
      cy.wait('@offersFlaky', { timeout: 15000 });
      cy.wait('@offersFlaky', { timeout: 15000 });

      cy.get('[data-testid=notification-bell]', { timeout: 10000 }).should('be.visible').click();
      cy.get('[data-testid=notification-menu]').should('be.visible');
      cy.contains('[data-testid=notification-menu]', 'Nema novih obaveštenja.').should(
        'be.visible',
      );
    });

    it('9 — 1000 aktivnih ponuda: UI ostaje odzivan (inbox max 50)', () => {
      const manyOffers = Array.from({ length: 1000 }, (_, i) => ({
        ...BASE_OFFER,
        id: i + 1,
        stockTicker: `T${i}`,
        buyerId: 77,
        sellerId: 88,
        status: 'PENDING_SELLER' as const,
        modifiedBy: '77',
      }));

      let poll = 0;
      cy.intercept('GET', '**/otc/offers/active', (req) => {
        poll += 1;
        const body =
          poll === 1
            ? manyOffers
            : manyOffers.map((o, i) =>
                i === 0
                  ? {
                      ...o,
                      status: 'PENDING_BUYER' as const,
                      pricePerStock: 160,
                      modifiedBy: '88',
                    }
                  : o,
              );
        req.reply({ statusCode: 200, body });
      }).as('offersActive');

      const started = Date.now();
      visitHome();
      waitInitialMonitorPoll();
      waitSecondOfferPoll();

      cy.get('[data-testid=notification-bell]', { timeout: 10000 }).should('be.visible').click();
      cy.get('[data-testid=notification-menu]').should('be.visible');
      cy.get('[data-testid=notification-item]').should('have.length', 1);
      cy.get('[data-testid=notification-item]').should('contain.text', 'kontraponudu');

      cy.then(() => {
        expect(Date.now() - started).to.be.lessThan(20000);
      });
    });
  });

  describe('pristupačnost (a11y)', () => {
    function stubInboxWithContractExpiry(): void {
      const soon = settlementInDays(2);
      cy.intercept('GET', '**/otc/contracts/my**', {
        statusCode: 200,
        body: [
          {
            id: 9,
            offerId: 1,
            stockTicker: 'AAPL',
            buyerId: 77,
            sellerId: 88,
            amount: 10,
            pricePerStock: 150,
            settlementDate: soon,
            status: 'ACTIVE',
            createdAt: '2026-01-01T10:00:00',
          },
        ],
      }).as('contractsActive');
      cy.intercept('GET', '**/otc/offers/active', { statusCode: 200, body: [] }).as('offersActive');
    }

    it('10 — tastatura: Enter otvara meni, strelica dole fokusira stavku, Escape zatvara', () => {
      stubInboxWithContractExpiry();
      visitHome();
      waitInitialMonitorPoll();

      cy.get('[data-testid=notification-bell]').focus();
      cy.focused().should('have.attr', 'data-testid', 'notification-bell');
      cy.focused().type('{enter}');

      cy.get('[data-testid=notification-menu]').should('be.visible');
      cy.get('[data-testid=notification-bell]').should('have.attr', 'aria-expanded', 'true');

      cy.get('body').type('{downarrow}');
      cy.focused().should('have.attr', 'data-testid', 'notification-item');

      cy.get('body').type('{esc}');
      cy.get('[data-testid=notification-menu]').should('not.exist');
      cy.get('[data-testid=notification-bell]').should('have.attr', 'aria-expanded', 'false');
    });

    it('11 — ARIA atributi na zvoncu i meniju', () => {
      visitHome();
      waitInitialMonitorPoll();

      cy.get('[data-testid=notification-bell]')
        .should('have.attr', 'aria-label')
        .and('match', /Notifikacije/);
      cy.get('[data-testid=notification-bell]').should('have.attr', 'aria-haspopup', 'menu');

      cy.get('[data-testid=notification-bell]').click();
      cy.get('[data-testid=notification-menu]')
        .should('have.attr', 'role', 'menu')
        .and('have.attr', 'aria-label', 'Notifikaciona lista');
      cy.get('[data-testid=notification-bell]').should('have.attr', 'aria-expanded', 'true');
    });
  });
});
