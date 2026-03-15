import { useSyncExternalStore } from 'react';

const COMPACT_HEIGHT = 500;

function subscribe(cb: () => void) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}

function getSnapshot() {
  return window.innerHeight < COMPACT_HEIGHT;
}

function getServerSnapshot() {
  return false;
}

/** Returns true when viewport height is small (landscape phone). */
export function useCompact() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
