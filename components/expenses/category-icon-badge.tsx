import { getCategoryIcon } from "@/lib/category-icons";

type CategoryIconBadgeProps = {
  categoryName: string;
  color: string;
  size?: "sm" | "md";
};

export function CategoryIconBadge({ categoryName, color, size = "md" }: CategoryIconBadgeProps) {
  const Icon = getCategoryIcon(categoryName);
  const dimension = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full`}
      style={{ backgroundColor: `${color}26` /* ~15% opacity tint of the category's own color */ }}
      aria-hidden="true"
    >
      <Icon className={iconSize} style={{ color }} />
    </span>
  );
}
