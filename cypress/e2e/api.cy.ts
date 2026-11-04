describe('API Health', () => {
  describe('Public Endpoints', () => {
    it('should return app status', () => {
      cy.request('/api/v1/status').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('version');
      });
    });

    it('should return public settings', () => {
      cy.request('/api/v1/settings/public').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('initialized', true);
      });
    });
  });

  describe('Auth Endpoints', () => {
    it('POST /auth/local should authenticate with valid credentials', () => {
      cy.env(['ADMIN_EMAIL', 'ADMIN_PASSWORD']).then(
        ({ ADMIN_EMAIL, ADMIN_PASSWORD }) => {
          cy.request('/api/v1/settings/public');
          cy.getCookie('XSRF-TOKEN').then((cookie) => {
            cy.request({
              method: 'POST',
              url: '/api/v1/auth/local',
              headers: cookie ? { 'X-XSRF-TOKEN': cookie.value } : {},
              body: {
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
              },
            }).then((resp) => {
              expect(resp.status).to.eq(200);
              expect(resp.body).to.have.property('id');
            });
          });
        }
      );
    });

    it('POST /auth/local should reject invalid credentials', () => {
      cy.request('/api/v1/settings/public');
      cy.getCookie('XSRF-TOKEN').then((cookie) => {
        cy.request({
          method: 'POST',
          url: '/api/v1/auth/local',
          headers: cookie ? { 'X-XSRF-TOKEN': cookie.value } : {},
          body: {
            email: 'invalid@test.com',
            password: 'wrongpassword',
          },
          failOnStatusCode: false,
        }).then((resp) => {
          expect(resp.status).to.eq(401);
        });
      });
    });

    it('GET /auth/me should return current user when authenticated', () => {
      cy.loginAsAdmin();

      cy.request('/api/v1/auth/me').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('id');
        expect(resp.body).to.have.property('email');
        expect(resp.body).to.have.property('username');
      });
    });
  });

  describe('CSRF Protection', () => {
    beforeEach(function () {
      cy.env(['CSRF_ENABLED']).then(({ CSRF_ENABLED }) => {
        if (CSRF_ENABLED !== true) {
          this.skip();
          return;
        }
        expect(Cypress.config('baseUrl'), 'CSRF-enabled target').to.match(
          /^https:\/\//
        );
        cy.request('/api/v1/settings/public');
        cy.getCookie('XSRF-TOKEN').should('exist');
        cy.getCookie('__Host-streamarr.csrf').should('include', {
          secure: true,
          httpOnly: true,
          path: '/',
        });
      });
    });

    it('rejects domain and path injection of the production secret cookie', () => {
      cy.visit('/');
      cy.window().then((window) => {
        window.document.cookie =
          '__Host-streamarr.csrf=path-injection; Path=/api/v1; Secure';
        window.document.cookie = `__Host-streamarr.csrf=domain-injection; Domain=${window.location.hostname}; Path=/; Secure`;
        window.document.cookie = `__Host-csrf-domain-probe=present; Domain=${window.location.hostname}; Path=/; Secure`;
        window.document.cookie = `csrf-domain-probe=present; Domain=${window.location.hostname}; Path=/; Secure`;
        window.document.cookie =
          'csrf-path-probe=present; Path=/api/v1; Secure';
      });
      cy.getAllCookies().then((cookies) => {
        const secrets = cookies.filter(
          (cookie) => cookie.name === '__Host-streamarr.csrf'
        );
        expect(secrets).to.have.length(1);
        expect(secrets[0].path).to.eq('/');
        expect(secrets[0].value).not.to.be.oneOf([
          'path-injection',
          'domain-injection',
        ]);
        const domainProbe = cookies.find(
          (cookie) => cookie.name === '__Host-csrf-domain-probe'
        );
        expect(
          domainProbe?.hostOnly ?? true,
          'host-prefixed cookies cannot become domain-scoped'
        ).to.eq(true);
        expect(
          cookies.some((cookie) => cookie.name === 'csrf-domain-probe'),
          'ordinary cookies can use Domain'
        ).to.eq(true);
        expect(
          cookies.some(
            (cookie) =>
              cookie.name === 'csrf-path-probe' && cookie.path === '/api/v1'
          ),
          'ordinary cookies can use a non-root path'
        ).to.eq(true);
      });
    });

    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      it(`rejects ${method} requests without a token`, () => {
        cy.request({
          method,
          url: '/api/v1/auth/local',
          failOnStatusCode: false,
        })
          .its('status')
          .should('eq', 403);
      });
    }

    it('rejects invalid tokens', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/local',
        headers: { 'X-XSRF-TOKEN': 'invalid-token' },
        failOnStatusCode: false,
      })
        .its('status')
        .should('eq', 403);
    });

    it('allows valid tokens through to authentication', () => {
      cy.getCookie('XSRF-TOKEN').then((cookie) => {
        expect(cookie).not.to.be.null;
        cy.request({
          method: 'POST',
          url: '/api/v1/auth/local',
          headers: { 'X-XSRF-TOKEN': cookie?.value ?? '' },
          body: { email: 'invalid@test.com', password: 'wrongpassword' },
          failOnStatusCode: false,
        })
          .its('status')
          .should('eq', 401);
      });
    });
  });

  describe('User Endpoints', () => {
    it('GET /user should return user list for admin', () => {
      cy.loginAsAdmin();

      cy.request('/api/v1/user').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('results');
        expect(resp.body.results).to.be.an('array');
        expect(resp.body.results.length).to.be.at.least(2);
      });
    });

    it('GET /user should return filtered list for regular user', () => {
      cy.loginAsUser();

      cy.request('/api/v1/user').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('results');
        expect(resp.body.results).to.be.an('array');
      });
    });

    it('GET /user/:id should return specific user for admin', () => {
      cy.loginAsAdmin();

      cy.request('/api/v1/user/1').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('id', 1);
      });
    });
  });

  describe('Settings Endpoints', () => {
    it('GET /settings/main should return main settings for admin', () => {
      cy.loginAsAdmin();

      cy.request('/api/v1/settings/main').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('applicationTitle');
        expect(resp.body).to.have.property('locale');
      });
    });

    it('GET /settings/main should be forbidden for regular user', () => {
      cy.loginAsUser();

      cy.request({
        url: '/api/v1/settings/main',
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(403);
      });
    });
  });

  describe('Invite Endpoints', () => {
    it('GET /invite should return invite list for admin', () => {
      cy.loginAsAdmin();

      cy.request('/api/v1/invite').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('results');
        expect(resp.body).to.have.property('pageInfo');
      });
    });

    it('GET /invite should support pagination params', () => {
      cy.loginAsAdmin();

      cy.request('/api/v1/invite?take=5&skip=0').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('pageInfo');
        expect(resp.body.pageInfo).to.have.property('pages');
      });
    });
  });

  describe('Calendar Endpoints', () => {
    it('GET /calendar/local should return local events', () => {
      cy.loginAsAdmin();

      cy.request('/api/v1/calendar/local').then((resp) => {
        expect(resp.status).to.eq(200);
      });
    });
  });

  describe('Notification Endpoints', () => {
    it('GET /notification should return notifications for admin', () => {
      cy.loginAsAdmin();

      cy.request('/api/v1/notification').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('results');
        expect(resp.body).to.have.property('pageInfo');
      });
    });

    it('GET /notification should be forbidden for regular user', () => {
      cy.loginAsUser();

      cy.request({
        url: '/api/v1/notification',
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(403);
      });
    });
  });

  describe('Onboarding Endpoint', () => {
    it('GET /user/:id/onboarding should return onboarding state', () => {
      cy.loginAsAdmin();

      cy.request('/api/v1/auth/me').then((meResp) => {
        const userId = meResp.body.id;
        cy.request(`/api/v1/user/${userId}/onboarding`).then((resp) => {
          expect(resp.status).to.eq(200);
        });
      });
    });
  });
});
