import { describe, it, expect } from "vitest";
import { sortItems } from "@/lib/sort";

const items = [
  { name: "Banana", amount: 20 },
  { name: "apple", amount: 5 },
  { name: "Cherry", amount: 12 },
];

describe("sortItems", () => {
  it("sorts A → Z case-insensitively", () => {
    const result = sortItems(items, "az", (i) => i.name, (i) => i.amount);
    expect(result.map((i) => i.name)).toEqual(["apple", "Banana", "Cherry"]);
  });

  it("sorts Z → A case-insensitively", () => {
    const result = sortItems(items, "za", (i) => i.name, (i) => i.amount);
    expect(result.map((i) => i.name)).toEqual(["Cherry", "Banana", "apple"]);
  });

  it("sorts by highest amount", () => {
    const result = sortItems(items, "amount-high", (i) => i.name, (i) => i.amount);
    expect(result.map((i) => i.amount)).toEqual([20, 12, 5]);
  });

  it("sorts by lowest amount", () => {
    const result = sortItems(items, "amount-low", (i) => i.name, (i) => i.amount);
    expect(result.map((i) => i.amount)).toEqual([5, 12, 20]);
  });

  it("does not mutate the original array", () => {
    const original = [...items];
    sortItems(items, "za", (i) => i.name, (i) => i.amount);
    expect(items).toEqual(original);
  });
});
