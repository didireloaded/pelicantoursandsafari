/** Map pointer position to the full object-cover crop range without zooming. */
export function photoPanPosition(x: number, y: number, width: number, height: number) {
  const percent = (value: number, extent: number) =>
    extent > 0 ? Math.max(0, Math.min(100, (value / extent) * 100)) : 50;
  return `${percent(x, width).toFixed(2)}% ${percent(y, height).toFixed(2)}%`;
}
