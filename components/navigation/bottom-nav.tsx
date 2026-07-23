"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Home, Settings as SettingsIcon, Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/forms/expense-form";
import { useExpenses } from "@/hooks/use-expenses";
import { cn } from "@/lib/utils";
import type { ExpenseInput } from "@/lib/validation/expense";

type Tab = { href: string; label: string; icon: ComponentType<{ className?: string }> };

const LEFT_TAB: Tab = { href: "/dashboard", label: "Home", icon: Home };
const RIGHT_TAB: Tab = { href: "/settings", label: "Settings", icon: SettingsIcon };

export function BottomNav() {
  const pathname = usePathname();
  const { createExpense } = useExpenses();
  const [isAddOpen, setIsAddOpen] = useState(false);

  async function handleAdd(input: ExpenseInput) {
    try {
      await createExpense.mutateAsync(input);
      setIsAddOpen(false);
      toast.success("Expense added");
    } catch {
      toast.error("Couldn't add that expense — try again.");
    }
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-around px-4 py-2">
          <NavLink tab={LEFT_TAB} active={pathname === LEFT_TAB.href} />

          <button
            onClick={() => setIsAddOpen(true)}
            aria-label="Add expense"
            className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition active:scale-95 hover:opacity-90"
          >
            <Plus className="h-7 w-7" />
          </button>

          <NavLink tab={RIGHT_TAB} active={pathname === RIGHT_TAB.href} />
        </div>
      </nav>

      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add an expense">
        <ExpenseForm onSubmit={handleAdd} isSubmitting={createExpense.isPending} />
      </Dialog>
    </>
  );
}

function NavLink({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      className={cn(
        "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      {tab.label}
    </Link>
  );
}
