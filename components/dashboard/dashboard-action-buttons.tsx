import Link from "next/link";
import { Receipt, Wallet, PiggyBank, LineChart, type LucideIcon } from "lucide-react";

const ACTIONS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/income", label: "Income", icon: Wallet },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/reports", label: "Reports", icon: LineChart },
];

export function DashboardActionButtons() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-3 text-center transition hover:bg-muted active:scale-[0.97]"
        >
          <Icon className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium">{label}</span>
        </Link>
      ))}
    </div>
  );
}
