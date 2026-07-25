import {
  Briefcase,
  Store,
  Building2,
  Laptop,
  Sparkles,
  TrendingUp,
  Home,
  Landmark,
  HeartHandshake,
  Gift,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { IncomeSourceType } from "@/lib/validation/income-source";

// Reuses hues already established elsewhere in the app's palette (jade,
// gold, chart colors) rather than inventing a new one.
const INCOME_SOURCE_STYLE: Record<IncomeSourceType, { icon: LucideIcon; color: string }> = {
  main_job: { icon: Briefcase, color: "#2BAE85" },
  secondary_job: { icon: Briefcase, color: "#4FA8C9" },
  self_employed: { icon: Store, color: "#E8896B" },
  business: { icon: Building2, color: "#5B8DEF" },
  freelance: { icon: Laptop, color: "#9B7FE8" },
  side_hustle: { icon: Sparkles, color: "#D98A4C" },
  investments: { icon: TrendingUp, color: "#C9A227" },
  rental_income: { icon: Home, color: "#3DA5D9" },
  pension: { icon: Landmark, color: "#1F8F6B" },
  benefits: { icon: HeartHandshake, color: "#E8748F" },
  gifts: { icon: Gift, color: "#8A6FD1" },
  other: { icon: Wallet, color: "#8A9199" },
};

export function getIncomeSourceStyle(type: IncomeSourceType): { icon: LucideIcon; color: string } {
  return INCOME_SOURCE_STYLE[type] ?? INCOME_SOURCE_STYLE.other;
}
