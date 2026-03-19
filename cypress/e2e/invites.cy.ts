describe('Invites Page', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('should load the invites page', () => {
    cy.visit('/invites');
    cy.url().should('include', '/invites');
  });

  it('should display invite management UI', () => {
    cy.visit('/invites');
    cy.get('[data-testid="page-header"]').should('exist');
  });

  describe('Invite API', () => {
    before(() => {
      // Enable signup so invite creation works
      cy.loginAsAdmin();
      cy.request({
        method: 'POST',
        url: '/api/v1/settings/main',
        body: { enableSignUp: true },
      });
    });

    after(() => {
      // Restore original setting
      cy.loginAsAdmin();
      cy.request({
        method: 'POST',
        url: '/api/v1/settings/main',
        body: { enableSignUp: false },
      });
    });

    it('should create an invite', () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/invite',
        body: {
          icode: '',
          inviteStatus: 1,
          usageLimit: 1,
          sharedLibraries: '',
        },
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('id');
        expect(resp.body).to.have.property('icode');
        expect(resp.body).to.have.property('usageLimit', 1);
      });
    });

    it('should list invites', () => {
      cy.request('/api/v1/invite').then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body).to.have.property('results');
        expect(resp.body.results).to.be.an('array');
      });
    });

    it('should delete an invite', () => {
      // Create an invite first
      cy.request({
        method: 'POST',
        url: '/api/v1/invite',
        body: {
          icode: '',
          inviteStatus: 1,
          usageLimit: 1,
          sharedLibraries: '',
        },
      }).then((createResp) => {
        const inviteId = createResp.body.id;

        // Delete it
        cy.request({
          method: 'DELETE',
          url: `/api/v1/invite/${inviteId}`,
        }).then((deleteResp) => {
          expect(deleteResp.status).to.eq(204);
        });
      });
    });

    it('should validate invite code via signup endpoint', () => {
      // Create an invite
      cy.request({
        method: 'POST',
        url: '/api/v1/invite',
        body: {
          icode: '',
          inviteStatus: 1,
          usageLimit: 1,
          sharedLibraries: '',
        },
      }).then((createResp) => {
        const inviteCode = createResp.body.icode;

        // Validate it
        cy.request(`/api/v1/signup/validate/${inviteCode}`).then(
          (validateResp) => {
            expect(validateResp.status).to.eq(200);
            expect(validateResp.body).to.have.property('valid', true);
          }
        );
      });
    });

    it('should reject invalid invite code', () => {
      cy.request({
        url: '/api/v1/signup/validate/INVALID_CODE',
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(404);
        expect(resp.body).to.have.property('valid', false);
      });
    });

    it('should reject invite creation when signup is disabled', () => {
      // Temporarily disable signup
      cy.request({
        method: 'POST',
        url: '/api/v1/settings/main',
        body: { enableSignUp: false },
      });

      cy.request({
        method: 'POST',
        url: '/api/v1/invite',
        body: {
          icode: '',
          inviteStatus: 1,
          usageLimit: 1,
          sharedLibraries: '',
        },
        failOnStatusCode: false,
      }).then((resp) => {
        expect(resp.status).to.eq(403);
      });

      // Re-enable for remaining tests
      cy.request({
        method: 'POST',
        url: '/api/v1/settings/main',
        body: { enableSignUp: true },
      });
    });
  });
});
