/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      loginAsUser(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session(
    [email, password],
    () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/local',
        body: { email, password },
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('id');
      });
    },
    {
      validate() {
        cy.request('/api/v1/auth/me').its('status').should('eq', 200);
      },
    }
  );
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.env(['ADMIN_EMAIL', 'ADMIN_PASSWORD']).then(
    ({ ADMIN_EMAIL, ADMIN_PASSWORD }) => {
      cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    }
  );
});

Cypress.Commands.add('loginAsUser', () => {
  cy.env(['USER_EMAIL', 'USER_PASSWORD']).then(
    ({ USER_EMAIL, USER_PASSWORD }) => {
      cy.login(USER_EMAIL, USER_PASSWORD);
    }
  );
});

export {};
