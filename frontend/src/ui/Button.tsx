import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";
import { Icon } from "./Icon";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary-container text-on-primary hover:brightness-110",
  secondary: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
  ghost: "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
  outline:
    "border border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: string;
  children?: ReactNode;
}

export function Button({
  variant = "secondary",
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-space-xs px-space-base py-space-xs rounded-lg font-label-md text-label-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0",
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  size?: number;
  label: string;
}

export function IconButton({ icon, size = 15, label, className, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "w-6 h-6 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors shrink-0",
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
