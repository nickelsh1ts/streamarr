/// <reference types="cypress" />
// Import commands.js using ES2015 syntax:
import './commands';
import 'cy-mobile-commands';

Cypress.on('uncaught:exception', (err) => {
  // Ignore known benign errors from third-party scripts and hydration
  const ignoredPatterns = [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'NEXT_NOT_FOUND',
    'hydrat',
    'Loading chunk',
    'ChunkLoadError',
  ];
  if (ignoredPatterns.some((p) => err.message?.includes(p))) {
    return false;
  }
  // Let unexpected errors fail the test
});
