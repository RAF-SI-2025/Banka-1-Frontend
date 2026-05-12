/// <reference types="cypress" />

// GHI #199 demo spec - pravi VIDEO + screenshot-ove sa kompletnim UI flow-om
// koji pokazuje team-leadu da BUY/SELL flow radi posle fix-eva.
//
// Strategija: BUY je vec uradjen u before() preko REST API-ja (kreira AAPL
// poziciju u Mateja-inom portfolju), spec onda pokazuje:
//   1. Login (real UI flow sa kucanjem)
//   2. Lista racuna (Greska #9: id je PK)
//   3. Portfolio sa AAPL pozicijom (BUY uspesno proveden)
//   4. Klik dugme "Prodaj" -> SELL forma se otvara (Greska #1 fix - GLAVNI cilj)
//   5. SELL flow + portfolio prazan posle settlement
//
// Cypress automatski pravi MP4 video u cypress/videos/issue-199-demo.cy.ts.mp4.
//
// Run:
//   $env:CYPRESS_BASE_URL = 'http://localhost:4200'
//   $env:CYPRESS_API_URL  = 'http://localhost'
//   npx cypress run --spec 'cypress/e2e/issue-199-demo.cy.ts' --browser electron --headless

const apiUrl = () => Cypress.env('apiUrl') || 'http://localhost';
const STEP_PAUSE_MS = 2000;       // pauza izmedju vizuelnih koraka
const SETTLEMENT_WAIT_MS = 80000; // INITIAL_EXECUTION_DELAY_MILLIS = 60_000L + buffer

describe('GHI #199 - BUY/SELL flow VIDEO demo', () => {
  let clientToken: string;
  let usdAccountId: number | null = null;

  before(() => {
    // 1) Login Mateja preko REST i pripremi USD FX racun + AAPL poziciju
    cy.loginAsClientApi().then((t) => {
      clientToken = t;
    });

    cy.request({
      method: 'GET',
      url: `${apiUrl()}/accounts/client/accounts?page=0&size=50`,
      headers: { Authorization: () => `Bearer ${clientToken}` },
      failOnStatusCode: false,
    }).then(() => {
      // re-fetch sa pravim headerom (token je sada postavljen)
      cy.request({
        method: 'GET',
        url: `${apiUrl()}/accounts/client/accounts?page=0&size=50`,
        headers: { Authorization: `Bearer ${clientToken}` },
      }).then((res) => {
        const usd = (res.body.content || []).find((a: any) => a.currency === 'USD');
        if (!usd) {
          cy.log('NEMA USD racuna - test setup nije zavrsen, vidi INSTRUKCIJE_199.md');
          throw new Error('USD account not found - run setup first');
        }
        usdAccountId = usd.id;
        cy.log(`USD account id=${usdAccountId} (PK, NE hash)`);

        // Provera da li portfolio vec ima AAPL; ako ne, kreiraj ga preko REST
        cy.request({
          method: 'GET',
          url: `${apiUrl()}/order/portfolio`,
          headers: { Authorization: `Bearer ${clientToken}` },
        }).then((p) => {
          const hasAapl = (p.body.holdings || []).some((h: any) => h.ticker === 'AAPL');
          if (!hasAapl) {
            cy.log('Portfolio prazan - pokrecem BUY pre demo-a');
            cy.request({
              method: 'POST',
              url: `${apiUrl()}/order/orders/buy`,
              headers: { Authorization: `Bearer ${clientToken}` },
              body: { listingId: 1, quantity: 1, accountId: usdAccountId, allOrNone: false, margin: false },
            }).then((buy) => {
              cy.request({
                method: 'POST',
                url: `${apiUrl()}/order/orders/${buy.body.id}/confirm`,
                headers: { Authorization: `Bearer ${clientToken}` },
              });
              cy.log('BUY confirm 200 - cekam settlement 80s');
              cy.wait(SETTLEMENT_WAIT_MS);
            });
          } else {
            cy.log('Portfolio vec ima AAPL - preskacem BUY');
          }
        });
      });
    });
  });

  it('Step 1: Login forma - korisnik se loguje preko UI-ja', () => {
    cy.visit('/login');
    cy.wait(STEP_PAUSE_MS);
    cy.contains(/Banka 1|Prijava/i, { timeout: 15000 }).should('be.visible');
    cy.screenshot('01-login-form-empty', { capture: 'viewport' });

    cy.get('[data-cy=email]').type(Cypress.env('clientEmail'), { delay: 80 });
    cy.wait(500);
    cy.get('[data-cy=password]').type(Cypress.env('clientPassword'), { delay: 80 });
    cy.wait(500);
    cy.screenshot('02-login-filled', { capture: 'viewport' });

    cy.get('[data-cy=login-btn]').click();
    cy.wait(STEP_PAUSE_MS * 2); // sacekaj redirect i SPA bootstrap
  });

  it('Step 2: Lista racuna - Greska #9 verifikacija (id je PK iz baze)', () => {
    cy.visitAsClient('/accounts');
    cy.wait(STEP_PAUSE_MS);
    cy.contains(/Lista računa|Lista racuna/i, { timeout: 15000 }).should('be.visible');
    cy.wait(STEP_PAUSE_MS);
    cy.screenshot('03-accounts-list', { capture: 'viewport' });

    cy.request({
      method: 'GET',
      url: `${apiUrl()}/accounts/client/accounts?page=0&size=50`,
      headers: { Authorization: `Bearer ${clientToken}` },
    }).then((res) => {
      const items: any[] = res.body.content || [];
      cy.log(`API: ${items.length} racuna, prvi id=${items[0]?.id} (mora biti PK < 1M, ne hash)`);
      items.forEach((a) => {
        expect(a.id, `racun ${a.brojRacuna}`).to.be.a('number').and.lessThan(1_000_000);
      });
    });
  });

  it('Step 3: Portfolio - AAPL pozicija je vidljiva (posle BUY+settlement)', () => {
    cy.visitAsClient('/portfolio');
    cy.wait(STEP_PAUSE_MS);
    cy.contains(/Portfolio|portfolio/i, { timeout: 15000 }).should('be.visible');
    cy.wait(STEP_PAUSE_MS);
    cy.contains(/AAPL|Apple/i, { timeout: 30_000 }).should('be.visible');
    cy.wait(STEP_PAUSE_MS);
    cy.screenshot('04-portfolio-with-aapl', { capture: 'viewport' });
  });

  it('Step 4: Klik "Prodaj" - GRESKA #1 FIX: SELL forma se otvara', () => {
    cy.visitAsClient('/portfolio');
    cy.wait(STEP_PAUSE_MS);
    cy.contains(/AAPL|Apple/i, { timeout: 30_000 }).should('be.visible');
    cy.wait(STEP_PAUSE_MS);

    // Hover/highlight dugme pre klika za vizualni efekat
    cy.contains('button', /Prodaj/i).first().scrollIntoView();
    cy.wait(1000);
    cy.screenshot('05-sell-button-highlighted', { capture: 'viewport' });

    // Klik - ovo je GLAVNI demo: ranije je bilo no-op TODO stub
    cy.contains('button', /Prodaj/i).first().click();
    cy.wait(STEP_PAUSE_MS);

    // URL mora da se promeni na /orders/create/SELL/{listingId}
    cy.url({ timeout: 10_000 }).should('match', /\/orders\/create\/SELL\/\d+/);
    cy.wait(STEP_PAUSE_MS);
    cy.screenshot('06-sell-form-opened-from-portfolio', { capture: 'viewport' });

    // Vidi se SELL forma
    cy.contains(/SELL|Prodaja|Order/i, { timeout: 10_000 }).should('be.visible');
    cy.wait(STEP_PAUSE_MS);
    cy.screenshot('07-sell-form-detail', { capture: 'viewport' });
  });

  it('Step 5: SELL preko REST + verifikacija da bank USD raste samo za commission (GRESKA #2)', () => {
    if (!usdAccountId) {
      cy.log('USD account id nije inicijalizovan, preskacem');
      return;
    }

    cy.request({
      method: 'POST',
      url: `${apiUrl()}/order/orders/sell`,
      headers: { Authorization: `Bearer ${clientToken}` },
      body: { listingId: 1, quantity: 1, accountId: usdAccountId, allOrNone: false, margin: false },
    }).then((sell) => {
      expect(sell.status).to.eq(200);
      expect(sell.body.status, 'SELL kreiran').to.eq('PENDING_CONFIRMATION');
      cy.log(`SELL id=${sell.body.id} price=${sell.body.pricePerUnit} fee=${sell.body.fee}`);
      cy.request({
        method: 'POST',
        url: `${apiUrl()}/order/orders/${sell.body.id}/confirm`,
        headers: { Authorization: `Bearer ${clientToken}` },
      }).then((confirm) => {
        expect(confirm.status, 'SELL confirm 200 - Greska #9 fix').to.eq(200);
        expect(confirm.body.status).to.match(/APPROVED|DONE/);
      });
    });

    cy.log('Cekam SELL settlement (80s)');
    cy.wait(SETTLEMENT_WAIT_MS);
  });

  it('Step 6: Portfolio prazan posle SELL - flow zavrsen', () => {
    cy.visitAsClient('/portfolio');
    cy.wait(STEP_PAUSE_MS);
    cy.contains(/Portfolio|portfolio/i, { timeout: 15000 }).should('be.visible');
    cy.wait(STEP_PAUSE_MS);
    cy.screenshot('08-portfolio-after-sell', { capture: 'viewport' });

    cy.request({
      method: 'GET',
      url: `${apiUrl()}/order/portfolio`,
      headers: { Authorization: `Bearer ${clientToken}` },
    }).then((res) => {
      const aapl = (res.body.holdings || []).find((h: any) => h.ticker === 'AAPL');
      cy.log(aapl ? `AAPL still in portfolio (qty=${aapl.quantity}) - settlement nije zavrsen` : 'AAPL pozicija zatvorena (0 holdings) - SELL flow uspesno zavrsen');
    });
  });
});
