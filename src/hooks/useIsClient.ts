import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the first client render, then `true` once
 * hydration has completed. Use this to gate browser-only UI without triggering
 * a synchronous setState inside an effect (which causes a cascading render).
 */
export const useIsClient = (): boolean =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

/**
 * Reads a value that is only available in the browser (e.g. from `window`)
 * while remaining hydration-safe: `serverValue` is used during SSR and the
 * first client render, after which `getSnapshot` is used. Unlike a
 * useState/useEffect pair this does not setState synchronously in an effect.
 */
export const useClientValue = <T>(getSnapshot: () => T, serverValue: T): T =>
  useSyncExternalStore(emptySubscribe, getSnapshot, () => serverValue);
