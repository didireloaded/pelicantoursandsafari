import {
  Children,
  isValidElement,
  useId,
  type ReactNode,
  type ComponentPropsWithoutRef,
} from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select";
import { cn } from "@/lib/utils";

type Props = Omit<
  ComponentPropsWithoutRef<typeof SelectTrigger>,
  "onChange" | "value" | "defaultValue"
> & {
  required?: boolean;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: { target: { value: string } }) => void;
};
const empty = "__pelican_empty_option__";
function optionText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? optionText(child.props.children)
          : "",
    )
    .join("")
    .trim();
}
function options(children: ReactNode): { value: string; label: ReactNode; disabled: boolean }[] {
  return Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)
    )
      return [];
    if (child.type === "option")
      return [
        {
          value: String(child.props.value ?? optionText(child.props.children)),
          label: child.props.children,
          disabled: child.props.disabled ?? false,
        },
      ];
    return options(child.props.children);
  });
}
/** The existing themed Radix select, with option children for catalogue-driven forms. */
export function AppSelect({
  children,
  value,
  defaultValue,
  onChange,
  className,
  id,
  name,
  required,
  disabled,
  ...props
}: Props) {
  const generatedId = useId();
  const entries = options(children);
  return (
    <Select
      {...(value === undefined ? {} : { value: String(value) })}
      {...(defaultValue === undefined ? {} : { defaultValue: String(defaultValue) })}
      onValueChange={(next) => onChange?.({ target: { value: next === empty ? "" : next } })}
      {...(name === undefined ? {} : { name })}
      {...(required === undefined ? {} : { required })}
      {...(disabled === undefined ? {} : { disabled })}
    >
      <SelectTrigger
        {...props}
        id={id ?? generatedId}
        className={cn("pelican-select-trigger", className)}
      >
        <SelectValue
          placeholder={entries.find((entry) => entry.value === "")?.label ?? "Choose an option"}
        />
      </SelectTrigger>
      <SelectContent position="popper" className="pelican-select-menu">
        {entries.map((entry) => (
          <SelectItem key={entry.value} value={entry.value || empty} disabled={entry.disabled}>
            {entry.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
