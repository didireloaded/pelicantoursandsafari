import * as Observability from "@openuidev/observability-cloud";

const apiKey = import.meta.env["VITE_OPENUI_OBSERVABILITY_API_KEY"];

if (apiKey?.startsWith("pk-th-")) {
  Observability.init({
    apiKey,
    capture: "minimal",
  });
}
