import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DebtCard } from "@/components/debts/debt-card";
import type { Debt } from "@/lib/validation/debt";

const formatCurrency = (value: number) => `£${value.toFixed(2)}`;

function baseDebt(overrides: Partial<Debt>): Debt {
  return {
    id: "1",
    name: "Visa Credit Card",
    type: "credit_card",
    currentBalance: 3600,
    interestRate: 0,
    ...overrides,
  };
}

describe("DebtCard — payoff calculator", () => {
  it("defaults to 'By payment' mode with no projection until an amount is entered", () => {
    render(<DebtCard debt={baseDebt({})} formatCurrency={formatCurrency} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByLabelText("Monthly payment")).toBeInTheDocument();
    expect(screen.queryByText(/Paid off in/)).not.toBeInTheDocument();
  });

  it("computes payoff time and interest when a monthly payment is entered", async () => {
    const user = userEvent.setup();
    render(
      <DebtCard
        debt={baseDebt({ currentBalance: 5000, interestRate: 20 })}
        formatCurrency={formatCurrency}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );

    await user.type(screen.getByLabelText("Monthly payment"), "200");

    expect(screen.getByText(/33 months/)).toBeInTheDocument();
    expect(screen.getByText(/£1600\.00/)).toBeInTheDocument();
  });

  it("warns when the payment doesn't cover the interest, instead of showing a nonsensical payoff time", async () => {
    const user = userEvent.setup();
    render(
      <DebtCard
        debt={baseDebt({ currentBalance: 10000, interestRate: 24 })}
        formatCurrency={formatCurrency}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );

    await user.type(screen.getByLabelText("Monthly payment"), "150");

    expect(screen.getByText(/won't cover the interest/)).toBeInTheDocument();
  });

  it("switching to 'By payoff date' mode computes the required monthly payment (matches the spec example)", async () => {
    const user = userEvent.setup();
    render(
      <DebtCard
        debt={baseDebt({ currentBalance: 3600, interestRate: 0 })}
        formatCurrency={formatCurrency}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );

    await user.click(screen.getByRole("button", { name: "By payoff date" }));
    await user.type(screen.getByLabelText("Pay off within (months)"), "6");

    // £3,600 over 6 months at 0% is simple division — £600/month.
    expect(screen.getByText(/£600\.00\/month/)).toBeInTheDocument();
  });

  it("shows a progress bar with the paid-off percentage when an original amount is set", () => {
    render(
      <DebtCard
        debt={baseDebt({ currentBalance: 6000, originalAmount: 10000 })}
        formatCurrency={formatCurrency}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.getByText("40% paid off")).toBeInTheDocument();
  });

  it("omits the progress bar when there's no original amount to compare against", () => {
    render(
      <DebtCard debt={baseDebt({ originalAmount: undefined })} formatCurrency={formatCurrency} onEdit={() => {}} onDelete={() => {}} />
    );
    expect(screen.queryByText(/paid off/)).not.toBeInTheDocument();
  });

  it("calls onEdit and onDelete from their respective buttons", async () => {
    const user = userEvent.setup();
    let editedCalled = false;
    let deletedCalled = false;

    render(
      <DebtCard
        debt={baseDebt({})}
        formatCurrency={formatCurrency}
        onEdit={() => {
          editedCalled = true;
        }}
        onDelete={() => {
          deletedCalled = true;
        }}
      />
    );

    await user.click(screen.getByRole("button", { name: /Edit/ }));
    expect(editedCalled).toBe(true);

    await user.click(screen.getByRole("button", { name: /Remove/ }));
    expect(deletedCalled).toBe(true);
  });
});
