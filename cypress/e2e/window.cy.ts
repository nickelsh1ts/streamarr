/// <reference types="cypress" />

describe('Window', () => {
  beforeEach(() => {
    cy.visit('/signin');
  });

  it('cy.window() - get the global window object', () => {
    cy.window().should('have.property', 'top');
  });

  it('cy.document() - get the document object', () => {
    cy.document().should('have.property', 'charset').and('eq', 'UTF-8');
  });

  it('cy.title() - get the title', () => {
    cy.title().should('include', 'Streamarr');
  });

  it('should have scroll-smooth on html element', () => {
    cy.get('html').should('have.class', 'scroll-smooth');
  });

  it('should have the streamarr data-theme', () => {
    cy.get('html').should('have.attr', 'data-theme', 'streamarr');
  });
});
