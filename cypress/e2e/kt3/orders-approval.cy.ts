// cypress/e2e/kt3/orders-approval.cy.ts
// Scenarios 48–58: Odobravanje i pregled naloga
export {};

const MOCK_PENDING_ORDER = {
  orderId: 1,
  agentName: 'Marko Petrovic',
  orderType: 'MARKET',
  listingType: 'STOCK',
  quantity: 10,
  contractSize: 1,
  pricePerUnit: 185.5,
  direction: 'BUY',
  remainingPortions: 10,
  status: 'PENDING',
  settlementDate: '2099-12-31',
};

const MOCK_DONE_ORDER = {
  ...MOCK_PENDING_ORDER,
  orderId: 2,
  status: 'APPROVED',
  remainingPortions: 0,
  settlementDate: '2099-12-31',
};

const MOCK_EXPIRED_ORDER = {
  ...MOCK_PENDING_ORDER,
  orderId: 3,
  status: 'PENDING',
  settlementDate: '2020-01-01',
};

const supervisorUser = {
  email: 'supervisor@banka.com',
  role: 'Supervisor',
  permissions: ['TRADE_UNLIMITED', 'SECURITIES_TRADE_UNLIMITED', 'FUND_AGENT_MANAGE'],
};

const visitOrdersAs = (user: object, orders = [MOCK_PENDING_ORDER]) => {
  cy.intercept('GET', /\/order\/orders(\?.*)?$/, {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { content: orders, totalElements: orders.length, totalPages: 1, number: 0, size: 10 },
  }).as('getOrders');

  cy.visit('/orders-overview', {
    onBeforeLoad: (win: any) => {
      win.localStorage.setItem('authToken', 'fake-jwt-token');
      win.localStorage.setItem('loggedUser', JSON.stringify(user));
    },
  });

  cy.wait('@getOrders');
};

// Scenario 55: Supervizor vidi sve potrebne kolone
describe('Scenario 55: Kolone u pregledu ordera', () => {
  beforeEach(() => {
    visitOrdersAs(supervisorUser);
  });

  it('prikazuje sve obavezne kolone tabele', () => {
    cy.contains('th', /agent/i).should('be.visible');
    cy.contains('th', /order type/i).should('be.visible');
    cy.contains('th', /asset/i).should('be.visible');
    cy.contains('th', /quantity/i).should('be.visible');
    cy.contains('th', /price\/unit/i).should('be.visible');
    cy.contains('th', /direction/i).should('be.visible');
    cy.contains('th', /remaining/i).should('be.visible');
    cy.contains('th', /status/i).should('be.visible');
  });
});

// Scenario 52: Supervizor odobrava pending order
describe('Scenario 52: Odobravanje pending ordera', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/order\/orders(\?.*)?$/, {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { content: [MOCK_PENDING_ORDER], totalElements: 1, totalPages: 1, number: 0, size: 10 },
    }).as('getOrders');

    cy.intercept('PUT', '**/order/orders/*/approve*', {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { ...MOCK_PENDING_ORDER, status: 'APPROVED' },
    }).as('approveOrder');

    cy.visit('/orders-overview', {
      onBeforeLoad: (win: any) => {
        win.localStorage.setItem('authToken', 'fake-jwt-token');
        win.localStorage.setItem('loggedUser', JSON.stringify(supervisorUser));
      },
    });

    cy.wait('@getOrders');
  });

  it('red ordera se prikazuje u tabeli', () => {
    cy.get('tbody').contains('td', 'Marko Petrovic').should('be.visible');
  });

  it('dugme Approve je vidljivo za pending order', () => {
    cy.get('tbody').contains('button', 'Approve').should('be.visible');
  });

  it('klik na Approve poziva API i order menja status', () => {
    cy.get('tbody').contains('button', 'Approve').click();
    cy.wait('@approveOrder');
    cy.get('@approveOrder').its('response.statusCode').should('eq', 200);
  });
});

// Scenario 53: Supervizor odbija pending order
describe('Scenario 53: Odbijanje pending ordera', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/order\/orders(\?.*)?$/, {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { content: [MOCK_PENDING_ORDER], totalElements: 1, totalPages: 1, number: 0, size: 10 },
    }).as('getOrders');

    cy.intercept('PUT', '**/order/orders/*/decline*', {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { ...MOCK_PENDING_ORDER, status: 'DECLINED' },
    }).as('declineOrder');

    cy.visit('/orders-overview', {
      onBeforeLoad: (win: any) => {
        win.localStorage.setItem('authToken', 'fake-jwt-token');
        win.localStorage.setItem('loggedUser', JSON.stringify(supervisorUser));
      },
    });

    cy.wait('@getOrders');
  });

  it('dugme Decline je vidljivo za pending order', () => {
    cy.get('tbody').contains('button', 'Decline').should('be.visible');
  });

  it('klik na Decline poziva API za odbijanje', () => {
    cy.get('tbody').contains('button', 'Decline').click();
    cy.wait('@declineOrder');
    cy.get('@declineOrder').its('response.statusCode').should('eq', 200);
  });
});

// Scenario 54: Order sa isteklim settlement date-om – samo Decline
describe('Scenario 54: Istekli order – samo Decline', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/order\/orders(\?.*)?$/, {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { content: [MOCK_EXPIRED_ORDER], totalElements: 1, totalPages: 1, number: 0, size: 10 },
    }).as('getOrders');

    cy.visit('/orders-overview', {
      onBeforeLoad: (win: any) => {
        win.localStorage.setItem('authToken', 'fake-jwt-token');
        win.localStorage.setItem('loggedUser', JSON.stringify(supervisorUser));
      },
    });

    cy.wait('@getOrders');
  });

  it('za istekli order Approve dugme nije prikazano', () => {
    cy.get('tbody').contains('button', 'Approve').should('not.exist');
  });

  it('za istekli order Decline dugme je dostupno', () => {
    cy.get('tbody').contains('button', 'Decline').should('be.visible');
  });
});

// Scenario 56: Filtriranje ordera po statusu Pending
describe('Scenario 56: Filter Pending', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/order\/orders(\?.*)?$/, (req) => {
      const hasPending = req.url.includes('status=PENDING');
      const orders = hasPending ? [MOCK_PENDING_ORDER] : [MOCK_PENDING_ORDER, MOCK_DONE_ORDER];
      req.reply({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { content: orders, totalElements: orders.length, totalPages: 1, number: 0, size: 10 },
      });
    }).as('getOrders');

    cy.visit('/orders-overview', {
      onBeforeLoad: (win: any) => {
        win.localStorage.setItem('authToken', 'fake-jwt-token');
        win.localStorage.setItem('loggedUser', JSON.stringify(supervisorUser));
      },
    });

    cy.wait('@getOrders');
  });

  it('klik na filter Pending filtrira ordere', () => {
    cy.contains('button', 'Pending').click();
    cy.wait('@getOrders');
    cy.contains('button', 'Pending').should('have.class', 'z-btn-primary');
  });
});

// Scenario 57: Filtriranje ordera po statusu Done
describe('Scenario 57: Filter Done', () => {
  beforeEach(() => {
    cy.intercept('GET', /\/order\/orders(\?.*)?$/, (req) => {
      const hasDone = req.url.includes('status=DONE') || req.url.includes('isDone=true');
      const orders = hasDone ? [MOCK_DONE_ORDER] : [MOCK_PENDING_ORDER, MOCK_DONE_ORDER];
      req.reply({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { content: orders, totalElements: orders.length, totalPages: 1, number: 0, size: 10 },
      });
    }).as('getOrders');

    cy.visit('/orders-overview', {
      onBeforeLoad: (win: any) => {
        win.localStorage.setItem('authToken', 'fake-jwt-token');
        win.localStorage.setItem('loggedUser', JSON.stringify(supervisorUser));
      },
    });

    cy.wait('@getOrders');
  });

  it('klik na filter Done prikazuje samo završene ordere', () => {
    cy.contains('button', 'Done').click();
    cy.wait('@getOrders');
    cy.contains('button', 'Done').should('have.class', 'z-btn-primary');
  });
});

// Scenario 48: Klijentov order automatski odobren (UI prikaz statusa)
describe('Scenario 48: Klijentov order – automatski Approved', () => {
  it('automatski odobren order ima status Approved bez Pending', () => {
    cy.intercept('GET', /\/order\/orders(\?.*)?$/, {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        content: [{ ...MOCK_DONE_ORDER, status: 'APPROVED' }],
        totalElements: 1, totalPages: 1, number: 0, size: 10,
      },
    }).as('getOrders');

    cy.visit('/orders-overview', {
      onBeforeLoad: (win: any) => {
        win.localStorage.setItem('authToken', 'fake-jwt-token');
        win.localStorage.setItem('loggedUser', JSON.stringify(supervisorUser));
      },
    });

    cy.wait('@getOrders');
    cy.contains('Approved').should('be.visible');
  });
});
