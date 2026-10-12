import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Photo } from "@/components/site";
import { photoPanPosition } from "@/lib/photo-pan";

let frames: Map<number, FrameRequestCallback>;
let sequence = 0;
let motion = true;
beforeEach(() => {
  frames = new Map();
  motion = true;
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      frames.set(++sequence, callback);
      return sequence;
    }),
  );
  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id: number) => frames.delete(id)),
  );
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: motion })),
  );
  vi.stubGlobal(
    "PointerEvent",
    class extends MouseEvent {
      pointerType: string;
      constructor(type: string, options: MouseEventInit & { pointerType?: string } = {}) {
        super(type, options);
        this.pointerType = options.pointerType ?? "mouse";
      }
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function photo() {
  const view = render(<Photo name="rhino" alt="Rhino" className="h-48 w-full object-cover" />);
  const image = screen.getByRole("img", { name: /Rhino/ }) as HTMLImageElement;
  image.style.objectFit = "cover";
  Object.defineProperty(image, "naturalWidth", { value: 1920 });
  vi.spyOn(image, "getBoundingClientRect").mockReturnValue({
    left: 10,
    top: 20,
    width: 640,
    height: 200,
  } as DOMRect);
  return { ...view, image };
}
function flush() {
  const callbacks = [...frames.values()];
  frames.clear();
  callbacks.forEach((callback) => callback(0));
}
it("maps both crop edges and clamps pointer coordinates", () => {
  expect(photoPanPosition(-10, 500, 640, 200)).toBe("0.00% 100.00%");
  expect(photoPanPosition(640, 0, 640, 200)).toBe("100.00% 0.00%");
  expect(photoPanPosition(10, 10, 0, 0)).toBe("50.00% 50.00%");
});
it("coalesces mouse motion into one frame and restores the crop on leave", () => {
  const { image } = photo();
  fireEvent.pointerMove(image, { pointerType: "mouse", clientX: 10, clientY: 20 });
  fireEvent.pointerMove(image, { pointerType: "mouse", clientX: 650, clientY: 220 });
  expect(frames.size).toBe(1);
  flush();
  expect(image.style.getPropertyValue("--photo-pan-position")).toBe("100.00% 100.00%");
  expect(image).toHaveAttribute("data-panning", "true");
  fireEvent.pointerLeave(image);
  expect(image).not.toHaveAttribute("data-panning");
  expect(image.style.getPropertyValue("--photo-pan-position")).toBe("");
});
it("does not hijack touch scrolling or animate with reduced motion", () => {
  const { image } = photo();
  fireEvent.pointerMove(image, { pointerType: "touch", clientX: 20, clientY: 20 });
  expect(frames.size).toBe(0);
  motion = false;
  fireEvent.pointerMove(image, { pointerType: "mouse", clientX: 20, clientY: 20 });
  expect(frames.size).toBe(0);
});
it("supports keyboard exploration, Escape and cancellation of pending work", () => {
  const { image, unmount } = photo();
  image.style.objectPosition = "50% 15%";
  fireEvent.keyDown(image, { key: "ArrowDown" });
  expect(image.style.getPropertyValue("--photo-pan-position")).toBe("50.00% 25.00%");
  fireEvent.keyDown(image, { key: "Escape" });
  expect(image).not.toHaveAttribute("data-panning");
  expect(image.style.objectPosition).toBe("50% 15%");
  fireEvent.pointerMove(image, { pointerType: "mouse", clientX: 20, clientY: 20 });
  unmount();
  expect(frames.size).toBe(0);
});
it("uses native auto sizes only for lazy images and excludes decorative backgrounds from focus", () => {
  const { rerender, image } = photo();
  expect(image.getAttribute("sizes")).toMatch(/^auto, /);
  expect(image).toHaveAttribute("loading", "lazy");
  expect(image).toHaveAttribute("tabindex", "0");
  rerender(
    <Photo
      name="rhino"
      alt="Rhino"
      className="object-cover"
      loading="eager"
      sizes="50vw"
      fetchPriority="high"
      pan={false}
    />,
  );
  expect(image).toHaveAttribute("sizes", "50vw");
  expect(image).toHaveAttribute("fetchpriority", "high");
  expect(image).not.toHaveAttribute("tabindex");
});
