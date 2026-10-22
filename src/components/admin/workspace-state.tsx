import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
export function WorkspaceState({
  loading,
  error,
  retry,
  children,
}: {
  loading: boolean;
  error: boolean;
  retry: () => void;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="admin-panel p-8">
        <p role="status">Loading your workspace…</p>
      </div>
    );
  if (error)
    return (
      <div className="admin-panel p-8">
        <h2 className="text-xl">Workspace unavailable</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Your data could not be checked. Please retry; no figures are being assumed.
        </p>
        <Button className="mt-5" variant="outline" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  return <>{children}</>;
}
