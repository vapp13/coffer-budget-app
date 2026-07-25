import {
  Repeat,
  Zap,
  PiggyBank,
  CreditCard,
  Shield,
  Home,
  Dumbbell,
  UtensilsCrossed,
  Car,
  User,
  TrendingUp,
  Wrench,
  Tag,
  type LucideIcon,
} from "lucide-react";

const KEYWORD_ICONS: [RegExp, LucideIcon][] = [
  [/subscription/i, Repeat],
  [/utilit/i, Zap],
  [/saving/i, PiggyBank],
  [/credit/i, CreditCard],
  [/insurance/i, Shield],
  [/hous|rent|mortgage/i, Home],
  [/gym|fitness/i, Dumbbell],
  [/food|groceries|dining/i, UtensilsCrossed],
  [/transport|car|fuel/i, Car],
  [/personal/i, User],
  [/invest/i, TrendingUp],
  [/maintenance|repair/i, Wrench],
];

/** A reasonable icon for a category name — falls back to a generic tag icon
 * for anything that doesn't match a known keyword (e.g. a custom category). */
export function getCategoryIcon(categoryName: string): LucideIcon {
  const match = KEYWORD_ICONS.find(([pattern]) => pattern.test(categoryName));
  return match ? match[1] : Tag;
}
