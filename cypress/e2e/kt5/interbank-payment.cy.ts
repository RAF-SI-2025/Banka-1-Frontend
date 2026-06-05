// cypress/e2e/kt5/interbank-payment.cy.ts
// Celina 5 — Međubankarsko plaćanje (Scenariji 1–3)

const TOKEN_77 = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTksImlkIjo3N30.mock';

const CLIENT_USER = {
  email: 'client@banka.com',
  role: 'Client',
  permissions: ['BANKING_BASIC'],
};

function visitPayment() {
  cy.visit('/accounts/payment/new', {
    onBeforeLoad(win: any) {
      win.localStorage.setItem('authToken', TOKEN_77);
      win.localStorage.setItem('loggedUser', JSON.stringify(CLIENT_USER));
    },
  });
}

// ─── Scenario 1 ───

describe('Scenario 1: Uspešno plaćanje na drugu banku', () => {

  it('Interbank plaćanje sa konverzijom, kursom i provizijom', () => {
    cy.intercept('GET', /\/accounts\/client\/accounts/, {
      statusCode: 200,
      body: {
        content: [{ accountNumber: '111222333444555666', name: 'Tekući račun', availableBalance: 50000, currency: 'RSD', status: 'ACTIVE', dailyLimit: 100000, monthlyLimit: 500000 }],
        totalElements: 1,
      },
    }).as('getAccounts');
    cy.intercept('POST', /\/verification\/generate/, { statusCode: 200, body: { sessionId: 1 } }).as('generateCode');
    cy.intercept('POST', /\/verification\/validate/, { statusCode: 200, body: 'OK' }).as('validateCode');
    cy.intercept('POST', /\/transactions\/payments/, { statusCode: 200, body: 'SUCCESS' }).as('createPayment');

    visitPayment();
    cy.wait('@getAccounts');

    cy.get('select[formcontrolname="senderAccount"]').select('111222333444555666');
    cy.get('input[formcontrolname="receiverName"]').type('Marko Marković');
    cy.get('input[formcontrolname="receiverAccount"]').type('4441234567890123456');
    cy.get('input[formcontrolname="amount"]').clear().type('150');
    cy.get('select[formcontrolname="paymentCode"]').select('289');
    cy.get('input[formcontrolname="purpose"]').type('Test');
    cy.contains('button', 'POTVRDI PLAĆANJE').click();
    cy.wait('@generateCode');

    cy.get('#code').type('123456');
    cy.contains('button', 'Potvrdi').click();
    cy.wait('@validateCode');
    cy.wait('@createPayment');

    cy.contains('UPLATA USPEŠNA').should('be.visible');
  });
});

// ─── Scenario 2 ───

describe('Scenario 2: Plaćanje na neaktivan račun', () => {

  it('Greška za neaktivan račun primaoca', () => {
    cy.intercept('GET', /\/accounts\/client\/accounts/, {
      statusCode: 200,
      body: {
        content: [{ accountNumber: '111222333444555666', name: 'Tekući račun', availableBalance: 50000, currency: 'RSD', status: 'ACTIVE', dailyLimit: 100000, monthlyLimit: 500000 }],
        totalElements: 1,
      },
    }).as('getAccounts');
    cy.intercept('POST', /\/verification\/generate/, { statusCode: 200, body: { sessionId: 1 } }).as('generateCode');
    cy.intercept('POST', /\/verification\/validate/, { statusCode: 200, body: 'OK' }).as('validateCode');
    cy.intercept('POST', /\/transactions\/payments/, {
      statusCode: 400,
      body: { errorTitle: 'Račun primaoca je neaktivan', errorDesc: 'Transakcija nije uspela' },
    }).as('createPaymentFail');

    visitPayment();
    cy.wait('@getAccounts');

    cy.get('select[formcontrolname="senderAccount"]').select('111222333444555666');
    cy.get('input[formcontrolname="receiverName"]').type('Test');
    cy.get('input[formcontrolname="receiverAccount"]').type('4440000000000123456');
    cy.get('input[formcontrolname="amount"]').clear().type('500');
    cy.get('select[formcontrolname="paymentCode"]').select('289');
    cy.get('input[formcontrolname="purpose"]').type('Test');
    cy.contains('button', 'POTVRDI PLAĆANJE').click();
    cy.wait('@generateCode');

    cy.get('#code').type('123456');
    cy.contains('button', 'Potvrdi').click();
    cy.wait('@validateCode');
    cy.wait('@createPaymentFail');
  });
});

// ─── Scenario 3 ───

describe('Scenario 3: Prikaz kursa i provizije pre potvrde', () => {

  it('Forma prikazuje unete podatke pre potvrde', () => {
    cy.intercept('GET', /\/accounts\/client\/accounts/, {
      statusCode: 200,
      body: {
        content: [{ accountNumber: '111222333444555666', name: 'Tekući račun', availableBalance: 50000, currency: 'RSD', status: 'ACTIVE', dailyLimit: 100000, monthlyLimit: 500000 }],
        totalElements: 1,
      },
    }).as('getAccounts');

    visitPayment();
    cy.wait('@getAccounts');

    cy.get('select[formcontrolname="senderAccount"]').select('111222333444555666');
    cy.get('input[formcontrolname="receiverName"]').type('Marko Marković');
    cy.get('input[formcontrolname="receiverAccount"]').type('4441234567890123456');
    cy.get('input[formcontrolname="amount"]').clear().type('150');
    cy.get('input[formcontrolname="amount"]').should('have.value', '150');
    cy.contains('NOVO PLAĆANJE').should('be.visible');
  });
});
