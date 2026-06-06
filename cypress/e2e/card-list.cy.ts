// cypress/e2e/card-list.cy.ts
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.mock';
const CLIENT = { email: 'c@b.com', role: 'Client', permissions: ['BANKING_BASIC'] };
const ACCOUNTS = { content: [
  { nazivRacuna: 'Tekući', brojRacuna: '265000000012345678', raspolozivoStanje: 81556, currency: 'RSD', accountCategory: 'CHECKING', accountType: 'PERSONAL', subtype: 'STANDARD' },
], totalElements: 1 };
const CARDS = { nazivRacuna: 'Tekući', brojRacuna: '265000000012345678', cards: [
  { id: 1, cardNumber: '57989999999995571', cardType: 'DEBIT', status: 'ACTIVE', expiryDate: '08/27', accountNumber: '265000000012345678' },
] };

describe('Card List', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/client\/accounts/, { statusCode: 200, body: ACCOUNTS }).as('a');
    cy.intercept('GET', /\/client\/api\/accounts\/2650/, { statusCode: 200, body: CARDS }).as('c');
    cy.visit('/home/cards', { onBeforeLoad(win: any) { win.localStorage.setItem('authToken', TOKEN); win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT)); } });
    cy.wait('@a'); cy.wait('@c');
  });

  it('prikazuje kartice', () => { cy.contains('Tekući').should('be.visible'); });
  it('bez tokena → /login', () => { cy.visit('/home/cards', { onBeforeLoad(win: any) { win.localStorage.clear(); } }); cy.url().should('include', '/login'); });
});
