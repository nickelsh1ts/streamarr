const signInElsewhere = () =>
  cy
    .env(['USER_EMAIL', 'USER_PASSWORD'])
    .then(({ USER_EMAIL, USER_PASSWORD }) =>
      cy.window().then((win) =>
        // Omitting credentials keeps the new session's cookie out of this browser
        win.fetch('/api/v1/auth/local', {
          method: 'POST',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
        })
      )
    )
    .its('status')
    .should('eq', 200);

const base64Url = (bytes: number[]) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const registerPush = (endpoint: string) =>
  cy
    .request('POST', '/api/v1/user/registerPushSubscription', {
      endpoint,
      p256dh: base64Url([4, ...Array(64).fill(1)]),
      auth: base64Url(Array(16).fill(2)),
    })
    .its('status')
    .should('eq', 204);

const pushEndpoints = () =>
  cy
    .request('/api/v1/auth/me')
    .then(({ body }) =>
      cy
        .request(`/api/v1/user/${body.id}/pushSubscriptions`)
        .then(({ body: devices }) =>
          devices.map((device: { endpoint: string }) => device.endpoint)
        )
    );

const linkedToSession = (endpoint: string) =>
  cy
    .request('/api/v1/auth/me')
    .then(({ body }) =>
      cy.request(
        `/api/v1/user/${body.id}/pushSubscription/${encodeURIComponent(endpoint)}`
      )
    )
    .its('body.linkedToSession');

// Leaves the old session live, as when a browser's cookies are cleared
const signInAgainInThisBrowser = () => {
  cy.clearCookies();
  cy.env(['USER_EMAIL', 'USER_PASSWORD']).then(
    ({ USER_EMAIL, USER_PASSWORD }) =>
      cy
        .request('POST', '/api/v1/auth/local', {
          email: USER_EMAIL,
          password: USER_PASSWORD,
        })
        .its('status')
        .should('eq', 200)
  );
};

describe('User Sessions', () => {
  describe('Own sessions', () => {
    beforeEach(() => {
      cy.loginAsUser();
    });

    it('lists the current session', () => {
      cy.visit('/profile/settings/devices');
      cy.contains('[data-testid="session-item"]', 'Current Device').should(
        'exist'
      );
    });

    it('signs out another session', () => {
      cy.visit('/profile/settings/devices');
      signInElsewhere();
      cy.reload();
      cy.get('[data-testid="session-item"]').should('have.length.gte', 2);
      cy.get('[data-testid="session-item"]').then((items) => {
        const count = items.length;
        cy.get('[data-testid="session-revoke"]').first().click();
        cy.get('[data-testid="session-revoke"]').first().click();
        cy.get('[data-testid="session-item"]').should('have.length', count - 1);
      });
    });

    it('signs out other sessions and keeps this one', () => {
      cy.visit('/profile/settings/devices');
      signInElsewhere();
      cy.reload();
      cy.get('[data-testid="sessions-sign-out-others"]').click();
      cy.get('[data-testid="modal-ok-button"]').click();
      cy.get('[data-testid="session-item"]').should('have.length', 1);
      cy.request('/api/v1/auth/me').its('status').should('eq', 200);
    });

    it('removes the push subscription of a signed-out device', () => {
      const endpoint = `https://fcm.googleapis.com/fcm/send/cypress-${Date.now()}`;
      registerPush(endpoint);
      signInAgainInThisBrowser();
      cy.request('/api/v1/auth/me').then(({ body }) =>
        cy.request('POST', `/api/v1/user/${body.id}/settings/sessions/revoke`, {
          scope: 'others',
        })
      );
      pushEndpoints().should('not.include', endpoint);
    });

    it('keeps a push subscription this device still uses', () => {
      const endpoint = `https://fcm.googleapis.com/fcm/send/cypress-${Date.now()}`;
      registerPush(endpoint);
      signInAgainInThisBrowser();
      linkedToSession(endpoint).should('eq', false);
      registerPush(endpoint);
      linkedToSession(endpoint).should('eq', true);
      cy.request('/api/v1/auth/me').then(({ body }) =>
        cy.request('POST', `/api/v1/user/${body.id}/settings/sessions/revoke`, {
          scope: 'others',
        })
      );
      pushEndpoints().should('include', endpoint);
      cy.request('/api/v1/auth/me').then(({ body }) =>
        cy.request(
          'DELETE',
          `/api/v1/user/${body.id}/pushSubscription/${encodeURIComponent(endpoint)}`
        )
      );
    });

    it('defaults to signing out other devices on password change', () => {
      cy.visit('/profile/settings/password');
      cy.get('#endOtherSessions').should('be.checked');
    });

    it('signs out everywhere straight to the sign-in page', () => {
      cy.visit('/profile/settings/devices');
      cy.get('[data-testid="sessions-sign-out-all"]').click();
      cy.get('[data-testid="modal-ok-button"]').click();
      cy.location('pathname').should('eq', '/signin');
      cy.location('search').should('not.contain', 'redirect_url');
      cy.request({ url: '/api/v1/auth/me', failOnStatusCode: false })
        .its('status')
        .should('eq', 401);
    });
  });

  describe('Admin managing a user', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
    });

    it('only offers signing out all sessions', () => {
      cy.visit('/admin/users/2/settings/devices');
      cy.get('[data-testid="sessions-sign-out-all"]').should('exist');
      cy.get('[data-testid="sessions-sign-out-others"]').should('not.exist');
    });

    it('reverts the IP tracking toggle when turning it off is cancelled', () => {
      cy.visit('/admin/settings/network');
      cy.get('#sessionIpTracking').should('be.checked').click();
      cy.contains('Stop Recording IP Addresses?').should('be.visible');
      cy.get('[data-testid="modal-cancel-button"]').click();
      cy.get('#sessionIpTracking').should('be.checked');
    });
  });
});
