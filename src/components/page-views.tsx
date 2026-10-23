import { useEffect, useRef } from "react";
export function PageViews({ path }: { path: string }) {
  const last = useRef("");
  useEffect(() => {
    if (last.current === path) return;
    last.current = path;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    let cancelled = false;
    const record = () => {
      if (cancelled) return;
      void import("@/lib/page-views.functions")
        .then(({ recordView }) => recordView({ data: { path } }))
        .catch(() => {});
    };
    const windowWithIdle = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId = windowWithIdle.requestIdleCallback?.(record, { timeout: 2000 });
    const timerId = idleId === undefined ? window.setTimeout(record, 1000) : undefined;
    return () => {
      cancelled = true;
      if (idleId !== undefined) windowWithIdle.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [path]);
  return null;
}
