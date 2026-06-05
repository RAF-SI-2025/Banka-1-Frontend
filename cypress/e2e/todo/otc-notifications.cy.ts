// cypress/e2e/todo/otc-notifications.cy.ts
// TODO — OTC Notifikacije (Scenariji 1–4)

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['OTC_TRADE'],
};

function setNotificationsAndVisit(notifications: object[], visitUrl = '/home') {
  cy.visit(visitUrl, {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
      win.localStorage.setItem('notifications', JSON.stringify(notifications));
    },
  });
}

// ─── Scenario 1: Indikator nepročitanih pregovora ───

describe('Scenario 1: Indikator nepročitanih pregovora', () => {

  it('Badge/broj na OTC portalu za nepročitane pregovore', () => {
    setNotificationsAndVisit([
      { id: 1, type: 'OTC_COUNTER_OFFER', title: 'Kontraponuda', message: 'Nova kontraponuda za AAPL.', read: false, timestamp: '2026-06-01T12:00:00' },
    ]);

    cy.get('[data-testid="notification-bell"]').should('be.visible').click();
    cy.get('[data-testid="notification-menu"]').should('be.visible');
    cy.get('[data-testid="notification-item"]').should('have.length.at.least', 1);
  });
});

// ─── Scenario 2: Notifikacija – kontraponuda primljena ───

describe('Scenario 2: Kontraponuda primljena', () => {

  it('In-app notifikacija o primljenoj kontraponudi', () => {
    setNotificationsAndVisit([
      { id: 1, type: 'OTC_COUNTER_OFFER', title: 'Kontraponuda primljena', message: 'Primljena je kontraponuda za AAPL. Nova cena: 165.00.', read: false, timestamp: '2026-06-01T12:00:00' },
    ]);

    cy.get('[data-testid="notification-bell"]').click();
    cy.get('[data-testid="notification-menu"]').should('be.visible');
    cy.get('[data-testid="notification-item"]').should('contain.text', 'kontraponuda');
  });
});

// ─── Scenario 3: Notifikacija – ponuda prihvaćena ───

describe('Scenario 3: Ponuda prihvaćena', () => {

  it('In-app notifikacija o prihvaćenoj ponudi', () => {
    setNotificationsAndVisit([
      { id: 2, type: 'OTC_ACCEPTED', title: 'Ponuda prihvaćena', message: 'Vaša ponuda za MSFT je prihvaćena.', read: false, timestamp: '2026-06-02T09:30:00' },
    ]);

    cy.get('[data-testid="notification-bell"]').click();
    cy.get('[data-testid="notification-item"]').should('contain.text', 'MSFT');
  });
});

// ─── Scenario 4: Notifikacija – opcioni ugovor ističe za 3 dana ───

describe('Scenario 4: Ugovor ističe uskoro', () => {

  it('Upozorenje o isteku ugovora u notifikacijama', () => {
    const expiryDate = new Date(Date.now() + 3 * 86400000).toISOString().substring(0, 10);

    setNotificationsAndVisit([
      { id: 3, type: 'OTC_EXPIRING_SOON', title: 'Ugovor uskoro ističe', message: `Opcioni ugovor za AAPL ističe za 3 dana (${expiryDate}).`, read: false, timestamp: '2026-06-05T08:00:00' },
    ]);

    cy.get('[data-testid="notification-bell"]').click();
    cy.get('[data-testid="notification-item"]').should('contain.text', 'ističe');
  });
});
