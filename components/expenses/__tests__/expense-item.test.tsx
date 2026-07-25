import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpenseItem } from "@/components/expenses/expense-item";
import type { Expense } from "@/lib/validation/expense";

const formatCurrency = (value: number) => `£${value.toFixed(2)}`;

function baseExpense(overrides: Partial<Expense>): Expense {
  return {
    id: "1",
    description: "Gym membership",
    categoryId: "cat-1",
    unitCost: 42,
    frequency: "monthly",
    expenseType: "recurring",
    isActive: true,
    ...overrides,
  };
}

function renderItem(expense: Expense, props: Partial<React.ComponentProps<typeof ExpenseItem>> = {}) {
  const handlers = {
    onViewDetails: vi.fn(),
    onEdit: vi.fn(),
    onArchive: vi.fn(),
    onDelete: vi.fn(),
  };
  render(
    <ExpenseItem
      expense={expense}
      categoryName="Subscriptions"
      formatCurrency={formatCurrency}
      onViewDetails={handlers.onViewDetails}
      onEdit={handlers.onEdit}
      onArchive={handlers.onArchive}
      onDelete={handlers.onDelete}
      {...props}
    />
  );
  return handlers;
}

describe("ExpenseItem", () => {
  it("shows a Recurring badge and the smoothed monthly/yearly cost for a recurring expense", () => {
    renderItem(baseExpense({ unitCost: 42, frequency: "monthly" }));

    expect(screen.getByText("Recurring")).toBeInTheDocument();
    expect(screen.getByText(/Monthly: £42\.00/)).toBeInTheDocument();
    expect(screen.getByText(/Yearly: £504\.00/)).toBeInTheDocument();
  });

  it("shows a One-time badge and no monthly/yearly cost line for a one-time expense", () => {
    renderItem(
      baseExpense({ expenseType: "one_time", unitCost: 500, startDate: new Date("2026-03-01") })
    );

    expect(screen.getByText("One-time")).toBeInTheDocument();
    expect(screen.queryByText(/Monthly:/)).not.toBeInTheDocument();
  });

  it("shows the ending-soon warning only when isEndingThisMonth is true", () => {
    const { rerender } = render(
      <ExpenseItem
        expense={baseExpense({})}
        categoryName="Subscriptions"
        formatCurrency={formatCurrency}
        isEndingThisMonth={false}
        onViewDetails={vi.fn()}
        onEdit={vi.fn()}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.queryByText("Ends this month")).not.toBeInTheDocument();

    rerender(
      <ExpenseItem
        expense={baseExpense({})}
        categoryName="Subscriptions"
        formatCurrency={formatCurrency}
        isEndingThisMonth={true}
        onViewDetails={vi.fn()}
        onEdit={vi.fn()}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText("Ends this month")).toBeInTheDocument();
  });

  it("hides the Edit action and swaps Archive for Restore when archived", () => {
    renderItem(baseExpense({ isActive: false }), { isArchived: true });

    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Restore/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Archive/ })).not.toBeInTheDocument();
  });

  it("calls the row's onViewDetails when clicking the row, but not when clicking an action button", async () => {
    const user = userEvent.setup();
    const handlers = renderItem(baseExpense({}));

    await user.click(screen.getByRole("button", { name: /Edit/ }));
    expect(handlers.onEdit).toHaveBeenCalledOnce();
    // The action button click shouldn't also open the details view — this
    // relies on stopPropagation, which is easy to accidentally break during
    // a refactor.
    expect(handlers.onViewDetails).not.toHaveBeenCalled();

    await user.click(screen.getByText("Gym membership"));
    expect(handlers.onViewDetails).toHaveBeenCalledOnce();
  });

  it("archive and delete buttons call their respective handlers independently", async () => {
    const user = userEvent.setup();
    const handlers = renderItem(baseExpense({}));

    await user.click(screen.getByRole("button", { name: /^Archive/ }));
    expect(handlers.onArchive).toHaveBeenCalledOnce();
    expect(handlers.onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Remove/ }));
    expect(handlers.onDelete).toHaveBeenCalledOnce();
  });
});
