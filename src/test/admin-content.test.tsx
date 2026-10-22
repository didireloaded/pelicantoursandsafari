import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ save: vi.fn(), load: vi.fn(), invalidate: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ useBlocker: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));
vi.mock("@/lib/site-content-api", () => ({ staffContent: mocks.load, saveContent: mocks.save }));
vi.mock("@/components/admin/photo-upload", () => ({ PhotoUpload: () => <p>Photo upload</p> }));
vi.mock("@/components/content-photo", () => ({ ContentPhoto: () => <div /> }));
import { ContentEditor } from "@/components/admin/content-editor";
import {
  blankPackage,
  packageContentSchema,
  photoContentSchema,
  readPublishedContent,
} from "@/lib/site-content";
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("saves a package draft, publishes explicitly and retains input on failed saves", async () => {
  mocks.load.mockResolvedValue([]);
  mocks.save.mockImplementation(async (id, kind, revision, action, draft) => ({
    id,
    kind,
    revision: revision + 1,
    draft,
    published: action === "publish" ? draft : null,
    updated_at: "2026-10-22",
  }));
  vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<ContentEditor kind="package" userId="staff" />);
  await waitFor(() => expect(screen.queryByText("Loading your content…")).not.toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("Package name"), { target: { value: "Etosha journey" } });
  fireEvent.change(screen.getByLabelText("Short description"), {
    target: { value: "Explore Etosha" },
  });
  fireEvent.change(screen.getByLabelText("Full description"), {
    target: { value: "Approved journey details" },
  });
  fireEvent.click(screen.getByLabelText("Etosha National Park"));
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await screen.findByText("Draft saved. The public version has not changed.");
  expect(mocks.save.mock.calls[0]?.[3]).toBe("save");
  fireEvent.click(screen.getByRole("button", { name: "Publish" }));
  await screen.findByText("Published. The website now uses this version.");
  expect(mocks.save.mock.calls[1]?.[2]).toBe(1);
  expect(mocks.save.mock.calls[1]?.[3]).toBe("publish");
  mocks.save.mockRejectedValue(new Error("Content changed; reload"));
  fireEvent.change(screen.getByLabelText("Package name"), {
    target: { value: "Keep my unsaved title" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await screen.findByText("Content changed; reload");
  expect(screen.getByLabelText("Package name")).toHaveValue("Keep my unsaved title");
});
it("validates catalogue destinations, approved prices, image paths and required descriptions", () => {
  const valid = {
    ...blankPackage(),
    title: "Etosha",
    summary: "Summary",
    description: "Verified",
    destinations: ["etosha"],
  };
  expect(packageContentSchema.parse(valid).details.rates).toEqual([]);
  expect(packageContentSchema.safeParse({ ...valid, destinations: ["invented"] }).success).toBe(
    false,
  );
  expect(
    packageContentSchema.safeParse({ ...valid, coverPath: "https://evil.example/a.svg" }).success,
  ).toBe(false);
  expect(
    photoContentSchema.safeParse({
      destination: "etosha",
      path: "bad",
      alt: "",
      caption: "",
      position: -1,
    }).success,
  ).toBe(false);
  expect(() =>
    readPublishedContent([
      {
        id: "x",
        kind: "package",
        data: { ...valid, details: { ...valid.details, rates: [{ amountNad: -4 }] } },
      },
    ]),
  ).toThrow();
});

it("carries only a valid package reference into the enquiry planning search",async()=>{
 const {planningSearch}=await import("../lib/safari-discovery");
 const id="33333333-3333-4333-8333-333333333333";
 expect(planningSearch({package:id,destinations:"etosha"})).toMatchObject({package:id,destinations:"etosha"});
 expect(planningSearch({package:"<script>"})).not.toHaveProperty("package");
});
