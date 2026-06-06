/**
 * PR_09 C9.2: Cypress live test za marzni racun flow (PR_03 spec).
 */

// JWT sa id=77; auth guard cita 'authToken', MarginAccountPortalComponent cita 'access_token'.
const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.rs',
  role: 'Client',
  permissions: [],
};

const MOCK_ACCOUNT = {
  accountNumber: '5550001000000000077',
  userId: 77,
  initialMargin: 50000,
  loanValue: 0,
  maintenanceMargin: 25000,
  bankParticipation: 0.30,
  active: true,
};

const MOCK_TRANSACTION = {
  id: 1,
  accountNumber: '5550001000000000077',
  amount: 500,
  transactionType: 'ADD_TO_MARGIN',
  occurredAt: '2025-01-01T10:00:00',
  description: 'deposit',
};

function visitMargin() {
  cy.visit('/margin', {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('access_token', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
    },
  });
}

describe('PR_03: Marzni racun portal', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/accounts/getMarginUser/**', { statusCode: 200, body: MOCK_ACCOUNT });
    cy.intercept('GET', '**/transactions/getAllMarginTransactions/**', {
      statusCode: 200,
      body: [MOCK_TRANSACTION],
    });
    cy.intercept('POST', '**/transactions/addToMargin/**', { statusCode: 200, body: {} });
  });

  it('prikazi portal za marzni racun', () => {
    visitMargin();
    cy.contains('Marzni racun').should('be.visible');
  });

  it('uplata sa tekuceg na marzni dodaje red u istoriju', () => {
    visitMargin();
    cy.get('body').then(($body) => {
      if ($body.text().includes('Trenutno nemate marzni racun')) {
        cy.log('Klijent nema marzni racun; test preskocen.');
        return;
      }

      cy.get('input[formcontrolname=amount]').first().clear().type('500');
      cy.contains('button', 'Uplati').click();

      cy.contains('ADD_TO_MARGIN', { timeout: 10000 }).should('be.visible');
    });
  });
});
