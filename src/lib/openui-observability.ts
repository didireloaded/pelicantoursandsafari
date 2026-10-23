import * as Observability from "@openuidev/observability-cloud";
import { getOpenUiObservabilityConfig } from "./openui-observability.functions";

let initialization: Promise<void> | undefined;

export function initializeOpenUiObservability() {
  if (typeof window === "undefined") return Promise.resolve();

  initialization ??= getOpenUiObservabilityConfig()
    .then(({ apiKey }) => {
      if (!apiKey) return;
      Observability.init({
        apiKey,
        capture: "minimal",
      });
    })
    .catch(() => {
      // Reliability monitoring must never interrupt the application.
    });

  return initialization;
}
