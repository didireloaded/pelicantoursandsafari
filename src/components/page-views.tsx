import { useEffect, useRef } from "react";
import { recordView } from "@/lib/page-views.functions";
export function PageViews({ path }: { path: string }) {
  const last = useRef("");
  useEffect(() => {
    if (last.current === path) return;
    last.current = path;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    void recordView({ data: { path } }).catch(() => {});
  }, [path]);
  return null;
}
