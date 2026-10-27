import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock("@/lib/enquiry-submit.functions", () => ({ submitTripEnquiry: mocks.submit }));
import { ContactEnquiry } from "@/components/contact-enquiry";
afterEach(() => { cleanup(); vi.resetAllMocks(); });
function fill() {
  render(<ContactEnquiry />);
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: " Traveller " } });
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "traveller@example.com" } });
  fireEvent.change(screen.getByLabelText("Your enquiry"), { target: { value: " Please help plan my safari. " } });
}
it("sends validated contact details through the existing protected enquiry service", async () => {
  mocks.submit.mockResolvedValue({ reference: "11111111-1111-4111-8111-111111111111" });
  fill();
  fireEvent.submit(screen.getByRole("form", { name: "Contact enquiry" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("11111111-1111-4111-8111-111111111111"));
  expect(mocks.submit.mock.calls[0]?.[0].data).toEqual({ request_id: expect.any(String), name: "Traveller", email: "traveller@example.com", phone: null, residence: null, contact_preference: "Email", safari_slug: null, brief: "Please help plan my safari." });
  expect(screen.getByRole("button", { name: "Enquiry received" })).toBeDisabled();
  expect(screen.getByRole("link")).toHaveAttribute("href", "mailto:info@pelicantoursandsafari.com");
});
it("keeps input and retry UUID on failure, blocks duplicate clicks, and renews UUID after edits", async () => {
  let reject!: (error: Error) => void;
  mocks.submit.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
  mocks.submit.mockResolvedValue({ error: "Submission unavailable" });
  fill();
  const form = screen.getByRole("form", { name: "Contact enquiry" });
  fireEvent.submit(form); fireEvent.submit(form);
  expect(mocks.submit).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error("connection lost")));
  expect(screen.getByRole("alert")).toHaveTextContent("could not confirm receipt");
  expect(screen.getByLabelText("Your enquiry")).toHaveValue(" Please help plan my safari. ");
  fireEvent.submit(form);
  await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Submission unavailable"));
  expect(mocks.submit.mock.calls[1]?.[0].data.request_id).toBe(mocks.submit.mock.calls[0]?.[0].data.request_id);
  fireEvent.change(screen.getByLabelText("Your enquiry"), { target: { value: "Different enquiry" } });
  fireEvent.submit(form);
  await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(3));
  expect(mocks.submit.mock.calls[2]?.[0].data.request_id).not.toBe(mocks.submit.mock.calls[0]?.[0].data.request_id);
});
it("rejects blank messages and invalid emails without contacting the server", () => {
  fill();
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "invalid" } });
  fireEvent.submit(screen.getByRole("form"));
  expect(screen.getByRole("alert")).toHaveTextContent("valid email");
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "traveller@example.com" } });
  fireEvent.change(screen.getByLabelText("Your enquiry"), { target: { value: "   " } });
  fireEvent.submit(screen.getByRole("form"));
  expect(mocks.submit).not.toHaveBeenCalled();
});
