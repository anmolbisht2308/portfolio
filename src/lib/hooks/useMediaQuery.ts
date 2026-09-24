"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Subscribe to a CSS media query. Returns `fallback` during SSR. */
export function useMediaQuery(query: string, fallback = false) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}
