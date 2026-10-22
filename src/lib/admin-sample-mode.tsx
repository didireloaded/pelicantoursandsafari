import { createContext, useContext, type ReactNode } from "react";

/** Sample mode is visual-only. It must never be a source for write operations. */
const SampleModeContext = createContext(false);

export function AdminSampleModeProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return <SampleModeContext.Provider value={enabled}>{children}</SampleModeContext.Provider>;
}

export function useAdminSampleMode() {
  return useContext(SampleModeContext);
}
