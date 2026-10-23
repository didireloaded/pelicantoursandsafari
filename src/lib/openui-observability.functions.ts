import { createServerFn } from "@tanstack/react-start";

export const getOpenUiObservabilityConfig = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env["OPENUI_CLIENT_ID_API_KEY"];

  return {
    apiKey: apiKey?.startsWith("pk-th-") ? apiKey : null,
  };
});
