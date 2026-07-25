import { getCategoryIcon } from "@/lib/category-icons";
import { IconBadge } from "@/components/ui/icon-badge";

type CategoryIconBadgeProps = {
  categoryName: string;
  color: string;
  size?: "sm" | "md";
};

export function CategoryIconBadge({ categoryName, color, size = "md" }: CategoryIconBadgeProps) {
  return <IconBadge icon={getCategoryIcon(categoryName)} color={color} size={size} />;
}
