describe('Plex Pin Authentication', () => {
  // Server contract tests — none of these reach plex.tv, so they are safe
  // for CI without network access to Plex.
  describe('Pin session contract', () => {
    it('should report unknown pin sessions as expired', () => {
      cy.request(
        '/api/v1/auth/plex/pin/00000000-0000-4000-8000-000000000000'
      ).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.status).to.eq('expired');
      });
    });

    it('should reject login with an unknown pin session id', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/plex',
        body: { pinId: '00000000-0000-4000-8000-000000000000' },
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(401);
      });
    });

    it('should reject signup with an unknown pin session id', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/signup/plexauth',
        body: {
          pinId: '00000000-0000-4000-8000-000000000000',
          icode: 'invalid',
        },
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.be.within(400, 401);
        expect(resp.body).to.have.property('success', false);
      });
    });

    it('should still reject login without a token or pin id', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/plex',
        body: {},
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(500);
      });
    });

    it('should never expose an auth token from the pin status endpoint', () => {
      cy.request(
        '/api/v1/auth/plex/pin/00000000-0000-4000-8000-000000000000'
      ).then((resp) => {
        expect(JSON.stringify(resp.body)).to.not.contain('authToken');
        expect(Object.keys(resp.body)).to.deep.eq(['status']);
      });
    });
  });

  // Full UI flow with every external interaction stubbed: the streamarr pin
  // endpoints are intercepted (same-origin, so cy.intercept works) and
  // window.open is stubbed so no real popup or plex.tv navigation occurs.
  describe('UI sign-in flow (stubbed)', () => {
    const PIN_ID = '11111111-1111-4111-8111-111111111111';

    it('should sign in through the pin lifecycle', () => {
      cy.intercept('POST', '/api/v1/auth/plex/pin', {
        statusCode: 200,
        body: {
          id: PIN_ID,
          authUrl: 'https://app.plex.tv/auth/#!?code=stubbed',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      }).as('createPin');

      cy.intercept('GET', `/api/v1/auth/plex/pin/${PIN_ID}`, {
        statusCode: 200,
        body: { status: 'authorized' },
      }).as('pinStatus');

      cy.intercept('POST', '/api/v1/auth/plex', (req) => {
        expect(req.body.pinId).to.eq(PIN_ID);
        expect(req.body).to.not.have.property('authToken');
        req.reply({ statusCode: 200, body: { id: 1 } });
      }).as('login');

      cy.intercept('GET', '/api/v1/auth/me', { statusCode: 403, body: {} }).as(
        'me'
      );

      cy.visit('/signin', {
        onBeforeLoad(win) {
          // Fake popup: never "closed", absorbs the auth URL navigation.
          const fakePopup = {
            closed: false,
            focus: () => undefined,
            close: () => undefined,
            location: { href: '' },
          };
          cy.stub(win, 'open').returns(fakePopup);
        },
      });

      cy.get('[data-testid="plex-login-button"]').click();

      cy.wait('@createPin');
      cy.wait('@pinStatus');
      // Allow for the client poll interval (~2s) plus the follow-up POST.
      cy.wait('@login', { timeout: 15000 })
        .its('request.body')
        .should('deep.include', { pinId: PIN_ID });
    });

    it('should surface an error when the pin session expires', () => {
      cy.intercept('POST', '/api/v1/auth/plex/pin', {
        statusCode: 200,
        body: {
          id: PIN_ID,
          authUrl: 'https://app.plex.tv/auth/#!?code=stubbed',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      });

      cy.intercept('GET', `/api/v1/auth/plex/pin/${PIN_ID}`, {
        statusCode: 200,
        body: { status: 'expired' },
      });

      cy.visit('/signin', {
        onBeforeLoad(win) {
          const fakePopup = {
            closed: false,
            focus: () => undefined,
            close: () => undefined,
            location: { href: '' },
          };
          cy.stub(win, 'open').returns(fakePopup);
        },
      });

      cy.get('[data-testid="plex-login-button"]').click();

      // The flow must end back on an idle sign-in button, not hang polling.
      cy.get('[data-testid="plex-login-button"]', { timeout: 15000 }).should(
        'not.be.disabled'
      );
    });
  });
});
