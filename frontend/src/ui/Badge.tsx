import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "tertiary"
  | "error"
  | "outline";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-container-high text-on-surface-variant",
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
  error: "bg-error-container text-on-error-container",
  outline: "border border-outline-variant text-on-surface-variant",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  pill?: boolean;
  className?: string;
}

export function Badge({ children, tone = "neutral", pill = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-space-2xs px-space-xs py-space-2xs font-mono-badge text-mono-badge uppercase shrink-0",
        pill ? "rounded-full" : "rounded",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
