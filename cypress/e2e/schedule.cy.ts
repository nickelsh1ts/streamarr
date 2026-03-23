describe('Schedule Page', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('/schedule');
  });

  it('should load the schedule page', () => {
    cy.url().should('include', '/schedule');
  });

  it('should display the schedule heading', () => {
    cy.contains('Release Schedule').should('exist');
  });

  it('should display the page header', () => {
    cy.get('[data-testid="page-header"]').should('exist');
  });

  it('should have a filter dropdown', () => {
    cy.get('[data-testid="schedule-filter-select"]').should('exist');
  });

  it('should allow filtering by movies', () => {
    cy.get('[data-testid="schedule-filter-select"]').select('movies');
    cy.get('[data-testid="schedule-filter-select"]').should(
      'have.value',
      'movies'
    );
  });

  it('should allow filtering by shows', () => {
    cy.get('[data-testid="schedule-filter-select"]').select('shows');
    cy.get('[data-testid="schedule-filter-select"]').should(
      'have.value',
      'shows'
    );
  });

  it('should allow filtering by local events', () => {
    cy.get('[data-testid="schedule-filter-select"]').select('local');
    cy.get('[data-testid="schedule-filter-select"]').should(
      'have.value',
      'local'
    );
  });

  it('should reset filter to all', () => {
    cy.get('[data-testid="schedule-filter-select"]').select('movies');
    cy.get('[data-testid="schedule-filter-select"]').select('all');
    cy.get('[data-testid="schedule-filter-select"]').should(
      'have.value',
      'all'
    );
  });

  it('should persist filter selection in localStorage', () => {
    cy.get('[data-testid="schedule-filter-select"]').select('movies');
    cy.window().then((win) => {
      const stored = win.localStorage.getItem('schedule-filter-settings');
      expect(stored).to.include('movies');
    });
  });
});
