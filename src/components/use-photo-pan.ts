import { useCallback, useEffect, useRef, type PointerEvent, type KeyboardEvent } from "react";
import { photoPanPosition } from "@/lib/photo-pan";

export function usePhotoPan() {
  const image = useRef<HTMLImageElement>(null);
  const frame = useRef<number | undefined>(undefined);
  const pointer = useRef({ x: 0, y: 0 });
  const reset = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    image.current?.removeAttribute("data-panning");
    image.current?.style.removeProperty("--photo-pan-position");
  }, []);
  useEffect(() => reset, [reset]);
  function key(event: KeyboardEvent<HTMLImageElement>) {
    if (event.key === "Escape") {
      reset();
      return;
    }
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const target = image.current;
    if (!target?.naturalWidth || getComputedStyle(target).objectFit !== "cover") return;
    event.preventDefault();
    const current =
      target.style.getPropertyValue("--photo-pan-position") ||
      getComputedStyle(target).objectPosition;
    const [x = 50, y = 50] = current.split(" ").map((value) => parseFloat(value));
    const nextX = x + (event.key === "ArrowLeft" ? -10 : event.key === "ArrowRight" ? 10 : 0);
    const nextY = y + (event.key === "ArrowUp" ? -10 : event.key === "ArrowDown" ? 10 : 0);
    target.style.setProperty("--photo-pan-position", photoPanPosition(nextX, nextY, 100, 100));
    target.setAttribute("data-panning", "true");
  }
  function move(event: PointerEvent<HTMLImageElement>) {
    if (
      event.pointerType !== "mouse" ||
      !window.matchMedia(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      ).matches
    ) {
      reset();
      return;
    }
    pointer.current = { x: event.clientX, y: event.clientY };
    if (frame.current !== undefined) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = undefined;
      const target = image.current;
      if (!target?.naturalWidth || getComputedStyle(target).objectFit !== "cover") return;
      const bounds = target.getBoundingClientRect();
      target.style.setProperty(
        "--photo-pan-position",
        photoPanPosition(
          pointer.current.x - bounds.left,
          pointer.current.y - bounds.top,
          bounds.width,
          bounds.height,
        ),
      );
      target.setAttribute("data-panning", "true");
    });
  }
  return {
    ref: image,
    onPointerMove: move,
    onPointerLeave: reset,
    onPointerCancel: reset,
    onBlur: reset,
    onKeyDown: key,
  };
}
