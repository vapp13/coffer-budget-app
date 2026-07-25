import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpenseItem } from "@/components/expenses/expense-item";
import type { Expense } from "@/lib/validation/expense";

const formatCurrency = (value: number) => `£${value.toFixed(2)}`;
const formatDate = (date: Date | undefined | null) => (date ? date.toLocaleDateString("en-GB") : "");

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
    onDuplicate: vi.fn(),
    onArchive: vi.fn(),
    onDelete: vi.fn(),
  };
  render(
    <ExpenseItem
      expense={expense}
      categoryName="Subscriptions"
      categoryColor="#4C6FFF"
      formatCurrency={formatCurrency}
      formatDate={formatDate}
      onViewDetails={handlers.onViewDetails}
      onEdit={handlers.onEdit}
      onDuplicate={handlers.onDuplicate}
      onArchive={handlers.onArchive}
      onDelete={handlers.onDelete}
      {...props}
    />
  );
  return handlers;
}

describe("ExpenseItem (compact card)", () => {
  it("shows the category, frequency, and amount for a recurring expense", () => {
    renderItem(baseExpense({ unitCost: 42, frequency: "monthly" }));

    expect(screen.getByText("Gym membership")).toBeInTheDocument();
    expect(screen.getByText("£42.00")).toBeInTheDocument();
    expect(screen.getByText("Subscriptions · Monthly")).toBeInTheDocument();
    expect(screen.getByText("/ month")).toBeInTheDocument();
  });

  it("avoids repeating 'One-time' twice — the badge covers it, so the category line shows just the category", () => {
    renderItem(baseExpense({ expenseType: "one_time", unitCost: 500, startDate: new Date("2026-03-01") }));

    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    expect(screen.queryByText("Subscriptions · One-time")).not.toBeInTheDocument();
    expect(screen.queryByText("/ month")).not.toBeInTheDocument();
    expect(screen.queryByText("/ year")).not.toBeInTheDocument();
  });

  it("shows the ending-soon warning only when isEndingThisMonth is true", () => {
    const { rerender } = render(
      <ExpenseItem
        expense={baseExpense({})}
        categoryName="Subscriptions"
        categoryColor="#4C6FFF"
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        isEndingThisMonth={false}
        onViewDetails={vi.fn()}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.queryByText("Ends this month")).not.toBeInTheDocument();

    rerender(
      <ExpenseItem
        expense={baseExpense({})}
        categoryName="Subscriptions"
        categoryColor="#4C6FFF"
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        isEndingThisMonth={true}
        onViewDetails={vi.fn()}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText("Ends this month")).toBeInTheDocument();
  });

  it("calls onViewDetails when the card is clicked", async () => {
    const user = userEvent.setup();
    const handlers = renderItem(baseExpense({}));

    await user.click(screen.getByText("Gym membership"));
    expect(handlers.onViewDetails).toHaveBeenCalledOnce();
  });

  it("opens the overflow menu and calls the right handler without triggering onViewDetails", async () => {
    const user = userEvent.setup();
    const handlers = renderItem(baseExpense({}));

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(handlers.onEdit).toHaveBeenCalledOnce();
    // Clicking inside the card's overflow menu must not also open the
    // details view — relies on stopPropagation, easy to break in a refactor.
    expect(handlers.onViewDetails).not.toHaveBeenCalled();
  });

  it("archived items show Restore instead of Edit/Duplicate in the overflow menu", async () => {
    const user = userEvent.setup();
    renderItem(baseExpense({ isActive: false }), { isArchived: true });

    await user.click(screen.getByRole("button", { name: "More actions" }));

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Duplicate" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
  });

  it("duplicate and delete actions work from the overflow menu", async () => {
    const user = userEvent.setup();
    const handlers = renderItem(baseExpense({}));

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(handlers.onDuplicate).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(handlers.onDelete).toHaveBeenCalledOnce();
  });
});
