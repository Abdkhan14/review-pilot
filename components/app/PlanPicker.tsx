"use client";

import { cn } from "@/lib/utils";

export type PlanChoice = "trial" | "basic" | "assisted";

export type PlanOption = {
  value: PlanChoice;
  title: string;
  price: string;
  description: string;
  disabled: boolean;
  /** Short reason shown in place of the price when the option is disabled. */
  disabledNote?: string;
};

type Props = {
  options: PlanOption[];
  value: PlanChoice | null;
  onChange: (value: PlanChoice) => void;
};

export function PlanPicker({ options, value, onChange }: Props) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">Plan</legend>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex gap-3 rounded-lg border px-4 py-3.5",
              option.disabled
                ? "cursor-not-allowed border-zinc-200 bg-zinc-50"
                : "cursor-pointer bg-white",
              selected ? "border-2 border-zinc-900" : !option.disabled && "border-zinc-200",
            )}
          >
            <input
              type="radio"
              name="plan"
              value={option.value}
              checked={selected}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
              className="mt-1 size-4 accent-zinc-900"
            />
            <span className="flex-1">
              <span className="flex items-baseline justify-between gap-3">
                <span className={cn("font-semibold", option.disabled ? "text-zinc-500" : "text-zinc-900")}>
                  {option.title}
                </span>
                <span className={cn("text-sm font-semibold", option.disabled ? "text-zinc-400" : "text-zinc-900")}>
                  {option.disabled && option.disabledNote ? option.disabledNote : option.price}
                </span>
              </span>
              <span className="mt-1 block text-sm text-zinc-600">{option.description}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
