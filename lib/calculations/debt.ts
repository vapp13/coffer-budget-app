import { round2 } from "@/lib/calculations/math-helpers";

export type PayoffProjection = {
  /** Whole months to reach zero balance, rounded up (a partial final month
   * still counts as a month). Null if the payment doesn't even cover the
   * monthly interest — the balance would never shrink at that payment. */
  months: number | null;
  /** Total interest paid over the life of the payoff at this payment level.
   * An estimate — the last month's payment is smaller in reality, so this
   * slightly overstates both figures. Null alongside `months` if it never pays off. */
  totalInterest: number | null;
};

/**
 * Standard amortization projection: given a balance, an annual interest
 * rate, and a fixed monthly payment, how long until it's paid off and how
 * much interest accrues along the way.
 *
 * Formula: n = -ln(1 - r·P / M) / ln(1 + r), where r is the monthly rate,
 * P the principal, and M the monthly payment. If the payment doesn't even
 * cover that month's interest (M ≤ r·P), the balance never actually
 * decreases — reported as "never pays off" rather than an infinite number.
 */
export function calculatePayoffProjection(
  balance: number,
  annualRatePercent: number,
  monthlyPayment: number
): PayoffProjection {
  if (balance <= 0 || monthlyPayment <= 0) {
    return { months: 0, totalInterest: 0 };
  }

  const monthlyRate = annualRatePercent / 100 / 12;

  if (monthlyRate === 0) {
    const months = Math.ceil(balance / monthlyPayment);
    return { months, totalInterest: 0 };
  }

  const monthlyInterestOnBalance = balance * monthlyRate;
  if (monthlyPayment <= monthlyInterestOnBalance) {
    return { months: null, totalInterest: null };
  }

  const months = Math.ceil(
    -Math.log(1 - (monthlyRate * balance) / monthlyPayment) / Math.log(1 + monthlyRate)
  );
  const totalInterest = round2(monthlyPayment * months - balance);

  return { months, totalInterest };
}

/**
 * The reverse of `calculatePayoffProjection`: given a desired payoff period,
 * what monthly payment is required? Standard loan-payment formula
 * M = P·r·(1+r)^n / ((1+r)^n − 1). Falls back to simple division (P / n)
 * when there's no interest, matching how a 0%-rate payoff would actually work.
 */
export function calculateRequiredPayment(
  balance: number,
  annualRatePercent: number,
  months: number
): number {
  if (balance <= 0 || months <= 0) return 0;

  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) {
    return round2(balance / months);
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return round2((balance * monthlyRate * factor) / (factor - 1));
}

/** Percentage of the original balance already paid off, 0–1. Null if no
 * original amount was recorded (nothing to compare progress against). */
export function calculatePaidOffPercentage(
  currentBalance: number,
  originalAmount: number | undefined
): number | null {
  if (!originalAmount || originalAmount <= 0) return null;
  const ratio = 1 - currentBalance / originalAmount;
  return Math.min(Math.max(ratio, 0), 1);
}

/**
 * Debt-to-income ratio: total monthly debt payments ÷ gross monthly income.
 * Only counts debts that have a monthly payment entered — a debt tracked
 * without one (e.g. just logging a mortgage balance) can't contribute a
 * known monthly figure, so it's left out rather than guessed at. Returns
 * null if there's no income to divide by.
 */
export function calculateDebtToIncomeRatio(
  totalMonthlyDebtPayments: number,
  grossMonthlyIncome: number
): number | null {
  if (grossMonthlyIncome <= 0) return null;
  return totalMonthlyDebtPayments / grossMonthlyIncome;
}
