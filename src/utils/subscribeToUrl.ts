const listeners = new Set<() => void>();
let lastHref = '';
let interval: ReturnType<typeof setInterval> | undefined;

const notifyIfChanged = () => {
  if (window.location.href === lastHref) {
    return;
  }
  lastHref = window.location.href;
  listeners.forEach((listener) => listener());
};

/**
 * Subscribes to browser URL changes, including iframe wrappers syncing the URL
 * via replaceState (which fires no event). One poller is shared by all
 * subscribers and only notifies when the URL actually changes.
 */
export const subscribeToUrl = (onChange: () => void) => {
  listeners.add(onChange);
  if (listeners.size === 1) {
    lastHref = window.location.href;
    window.addEventListener('popstate', notifyIfChanged);
    window.addEventListener('hashchange', notifyIfChanged);
    interval = setInterval(notifyIfChanged, 100);
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      window.removeEventListener('popstate', notifyIfChanged);
      window.removeEventListener('hashchange', notifyIfChanged);
      clearInterval(interval);
    }
  };
};
