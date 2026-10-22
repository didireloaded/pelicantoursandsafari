import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  signin: vi.fn(),
  resend: vi.fn(),
  recovery: vi.fn(),
  update: vi.fn(),
  user: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    useSearch: () => ({ next: "/dashboard" }),
  }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@/components/site", () => ({
  Section: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: mocks.signin,
      resend: mocks.resend,
      resetPasswordForEmail: mocks.recovery,
      updateUser: mocks.update,
      getUser: mocks.user,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: mocks.unsubscribe } } }),
    },
  },
}));
import { Route as Auth } from "../routes/auth";
import { Route as Reset } from "../routes/reset-password";
const authPage = (Auth.options as unknown as { component: React.ComponentType }).component;
const resetPage = (Reset.options as unknown as { component: React.ComponentType }).component;
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("recovers from rejected sign-in requests and allows retry", async () => {
  mocks.signin.mockRejectedValue(new Error("network down"));
  render(React.createElement(authPage));
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "staff@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Check your connection");
  expect(screen.getByRole("button", { name: "Sign in" })).not.toBeDisabled();
});
it("sends recovery links to the fixed allowlisted path, without confirming account existence", async () => {
  mocks.recovery.mockResolvedValue({ error: null });
  render(React.createElement(authPage));
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "staff@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
  expect(await screen.findByRole("status")).toHaveTextContent("If an account exists");
  expect(mocks.recovery).toHaveBeenCalledWith("staff@example.com", {
    redirectTo: `${window.location.origin}/reset-password`,
  });
});
it("blocks password writes for expired or absent sessions", async () => {
  mocks.user.mockResolvedValue({ data: { user: null }, error: null });
  render(React.createElement(resetPage));
  expect(await screen.findByRole("status")).toHaveTextContent("recovery link");
  expect(screen.getByRole("button", { name: "Update password" })).toBeDisabled();
  expect(mocks.update).not.toHaveBeenCalled();
});
import React from "react";

it("explains invalid credentials without requiring developer approval and normalizes email", async () => {
  mocks.signin.mockResolvedValue({
    error: { code: "invalid_credentials", message: "Invalid login credentials" },
  });
  render(React.createElement(authPage));
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "OWNER@EXAMPLE.COM" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Google or Apple");
  expect(mocks.signin).toHaveBeenCalledWith({
    email: "owner@example.com",
    password: "test-password",
  });
});

it("resends confirmation with a normalized email and cooldown without claiming delivery", async () => {
  mocks.resend.mockResolvedValue({ error: null });
  render(React.createElement(authPage));
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "LAURYN@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Resend confirmation email" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "If this email has an account waiting for confirmation",
  );
  expect(mocks.resend).toHaveBeenCalledWith({
    type: "signup",
    email: "lauryn@example.com",
    options: { emailRedirectTo: `${window.location.origin}/admin` },
  });
  expect(
    await screen.findByRole("button", { name: "Wait a minute before resending" }),
  ).toBeDisabled();
});
it("handles a rate-limited confirmation request without saying it was sent", async () => {
  mocks.resend.mockResolvedValue({ error: { status: 429 } });
  render(React.createElement(authPage));
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "guest@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Resend confirmation email" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Please wait a minute");
  expect(
    await screen.findByRole("button", { name: "Wait a minute before resending" }),
  ).toBeDisabled();
});
it("requires an address and retains a retry after network failure", async () => {
  mocks.resend.mockRejectedValue(new Error("offline"));
  render(React.createElement(authPage));
  fireEvent.click(screen.getByRole("button", { name: "Resend confirmation email" }));
  expect(mocks.resend).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "guest@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Resend confirmation email" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Check your connection");
  expect(screen.getByRole("button", { name: "Resend confirmation email" })).not.toBeDisabled();
});
