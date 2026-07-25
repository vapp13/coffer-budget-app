import { describe, it, expect } from "vitest";
import { debtSchema } from "@/lib/validation/debt";

describe("debtSchema — optional numeric fields", () => {
  const baseInput = {
    name: "Test Card",
    type: "credit_card" as const,
    currentBalance: 1000,
    interestRate: 20,
  };

  it("allows creating a debt with originalAmount and minimumPayment left empty", () => {
    const result = debtSchema.safeParse({
      ...baseInput,
      originalAmount: "",
      minimumPayment: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.originalAmount).toBeUndefined();
      expect(result.data.minimumPayment).toBeUndefined();
    }
  });

  it("allows omitting originalAmount and minimumPayment entirely", () => {
    const result = debtSchema.safeParse(baseInput);
    expect(result.success).toBe(true);
  });

  it("still validates a provided originalAmount/minimumPayment as positive", () => {
    const result = debtSchema.safeParse({
      ...baseInput,
      originalAmount: 5000,
      minimumPayment: 100,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.originalAmount).toBe(5000);
      expect(result.data.minimumPayment).toBe(100);
    }
  });

  it("still rejects a negative or zero originalAmount when one is provided", () => {
    const result = debtSchema.safeParse({ ...baseInput, originalAmount: 0 });
    expect(result.success).toBe(false);
  });
});
