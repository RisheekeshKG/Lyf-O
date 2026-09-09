import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const CONTROL =
  "w-full px-space-base py-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-body-md text-body-md outline-none transition-colors focus:border-primary-container";

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="block mb-space-xs font-label-md text-label-md text-on-surface-variant">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block mt-space-2xs font-label-sm text-label-sm text-on-surface-variant/50">
          {hint}
        </span>
      )}
    </label>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: string[];
}

export function SelectInput({ options, className, ...props }: SelectInputProps) {
  return (
    <select className={cn(CONTROL, "appearance-none cursor-pointer", className)} {...props}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
