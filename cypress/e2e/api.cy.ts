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
          cy.request({
            method: 'POST',
            url: '/api/v1/auth/local',
            body: {
              email: ADMIN_EMAIL,
              password: ADMIN_PASSWORD,
            },
          }).then((resp) => {
            expect(resp.status).to.eq(200);
            expect(resp.body).to.have.property('id');
          });
        }
      );
    });

    it('POST /auth/local should reject invalid credentials', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/local',
        body: {
          email: 'invalid@test.com',
          password: 'wrongpassword',
        },
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(403);
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
