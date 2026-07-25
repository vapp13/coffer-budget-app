import type { LucideIcon } from "lucide-react";

type IconBadgeProps = {
  icon: LucideIcon;
  color: string;
  size?: "sm" | "md";
};

export function IconBadge({ icon: Icon, color, size = "md" }: IconBadgeProps) {
  const dimension = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full`}
      style={{ backgroundColor: `${color}26` /* ~15% opacity tint of the given color */ }}
      aria-hidden="true"
    >
      <Icon className={iconSize} style={{ color }} />
    </span>
  );
}
