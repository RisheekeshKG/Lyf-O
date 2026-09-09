import { cn } from "../lib/cn";

interface IconProps {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
}

/**
 * Material Symbols Outlined — the icon set the design is drawn with.
 * Glyphs are ligatures, so the name renders as text: hide it from assistive
 * tech or it leaks into every button's accessible name.
 */
export function Icon({ name, size = 16, filled = false, className }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined leading-none", className)}
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
      }}
    >
      {name}
    </span>
  );
}
