import { fireEvent, screen } from "@testing-library/react";
/** Exercise the same keyboard path offered to travellers and staff. */
export function chooseOption(label: string | RegExp, option: string) {
  HTMLElement.prototype.scrollIntoView ??= () => {};
  fireEvent.keyDown(screen.getByRole("combobox", { name: label }), { key: "ArrowDown" });
  fireEvent.click(screen.getByRole("option", { name: option }));
}
