/**
 * DOM utility functions for element visibility, iframe handling,
 * and rect calculations used by tutorial overlay components.
 */

/**
 * Check if element or any ancestor is effectively hidden.
 * Uses native checkVisibility API when available and falls back
 * to manual style inspection.
 */
export const isElementVisible = (el: Element): boolean => {
  const htmlEl = el as HTMLElement;

  // Use native checkVisibility API if available (more reliable)
  if (typeof htmlEl.checkVisibility === 'function') {
    if (
      !htmlEl.checkVisibility({
        checkOpacity: true,
        checkVisibilityCSS: true,
      })
    ) {
      return false;
    }
  }

  // Quick check: offsetParent is null for elements with display:none ancestors
  // (except for body, html, and fixed/sticky positioned elements)
  if (
    htmlEl.offsetParent === null &&
    htmlEl.offsetWidth === 0 &&
    htmlEl.offsetHeight === 0
  ) {
    return false;
  }

  let current: Element | null = el;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const opacity = parseFloat(style.opacity);
    // Check for common hidden states
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      opacity < 0.01 ||
      (parseFloat(style.height) === 0 && style.overflow === 'hidden') ||
      (parseFloat(style.maxHeight) === 0 && style.overflow === 'hidden') ||
      style.pointerEvents === 'none'
    ) {
      return false;
    }
    // Check for Headless UI Transition closed state
    if (current.hasAttribute('data-closed')) {
      return false;
    }
    current = current.parentElement;
  }
  return true;
};

/**
 * Converts a selector to a full CSS selector.
 * Supports both full selectors and shorthand data-tutorial IDs.
 */
export const getFullSelector = (selector: string): string => {
  return selector.startsWith('[') ||
    selector.startsWith('.') ||
    selector.startsWith('#')
    ? selector
    : `[data-tutorial="${selector}"]`;
};

interface ElementWithIframe {
  el: Element;
  iframeRect?: DOMRect;
  isIframe: boolean;
}

/**
 * Queries all matching elements from the main document and same-origin iframes.
 */
export const queryAllDocuments = (
  fullSelector: string
): ElementWithIframe[] => {
  const results: ElementWithIframe[] = [];

  // Search main document
  const mainElements = document.querySelectorAll(fullSelector);
  for (const el of mainElements) {
    results.push({ el, isIframe: false });
  }

  // Search within same-origin iframes
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      const iframeDoc = (iframe as HTMLIFrameElement).contentDocument;
      if (iframeDoc?.defaultView) {
        const iframeElements = iframeDoc.querySelectorAll(fullSelector);
        const iframeRect = iframe.getBoundingClientRect();
        for (const el of iframeElements) {
          results.push({ el, iframeRect, isIframe: true });
        }
      }
    } catch {
      // Cross-origin iframe, skip
    }
  }

  return results;
};

/**
 * Finds the iframe containing a given element and returns its current rect.
 * Returns the adjusted rect for the element within the iframe context.
 */
export const getElementRectInIframe = (element: Element): DOMRect | null => {
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      const iframeDoc = (iframe as HTMLIFrameElement).contentDocument;
      if (iframeDoc?.contains(element)) {
        const iframeRect = iframe.getBoundingClientRect();
        const elRect = element.getBoundingClientRect();
        return new DOMRect(
          elRect.x + iframeRect.x,
          elRect.y + iframeRect.y,
          elRect.width,
          elRect.height
        );
      }
    } catch {
      // Cross-origin, skip
    }
  }
  return null;
};

/**
 * Gets the current rect of an element, handling iframe offset if needed.
 */
export const getCurrentElementRect = (
  element: Element,
  storedIframeRect?: DOMRect
): DOMRect => {
  if (storedIframeRect) {
    const result = getElementRectInIframe(element);
    if (result) return result;
  }
  return element.getBoundingClientRect();
};

/**
 * Sets up iframe observers for DOM changes and returns a cleanup function.
 */
export const observeIframeDocuments = (callback: () => void): (() => void) => {
  const observers: MutationObserver[] = [];
  const iframes = document.querySelectorAll('iframe');

  for (const iframe of iframes) {
    try {
      const iframeDoc = (iframe as HTMLIFrameElement).contentDocument;
      if (iframeDoc?.body) {
        const observer = new MutationObserver(callback);
        observer.observe(iframeDoc.body, { childList: true, subtree: true });
        observers.push(observer);
      }
    } catch {
      // Cross-origin, skip
    }
  }

  return () => {
    for (const observer of observers) {
      observer.disconnect();
    }
  };
};

/**
 * Sets up scroll listeners on same-origin iframes.
 * Returns a cleanup function.
 */
export const addIframeScrollListeners = (handler: () => void): (() => void) => {
  const listeners: { win: Window; handler: () => void }[] = [];
  const iframes = document.querySelectorAll('iframe');

  for (const iframe of iframes) {
    try {
      const iframeWin = (iframe as HTMLIFrameElement).contentWindow;
      if (iframeWin) {
        iframeWin.addEventListener('scroll', handler, true);
        listeners.push({ win: iframeWin, handler });
      }
    } catch {
      // Cross-origin, skip
    }
  }

  return () => {
    for (const { win, handler: h } of listeners) {
      try {
        win.removeEventListener('scroll', h, true);
      } catch {
        // Iframe may have been removed
      }
    }
  };
};

/**
 * Checks if rects have significantly changed (threshold of 1px).
 */
export const hasRectChanged = (
  current: DOMRect,
  last: DOMRect | null
): boolean => {
  if (!last) return true;
  return (
    Math.abs(current.x - last.x) > 1 ||
    Math.abs(current.y - last.y) > 1 ||
    Math.abs(current.width - last.width) > 1 ||
    Math.abs(current.height - last.height) > 1
  );
};
