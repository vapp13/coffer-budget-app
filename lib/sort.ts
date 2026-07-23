export type SortOption = "az" | "za" | "amount-high" | "amount-low";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
  { value: "amount-high", label: "Highest amount" },
  { value: "amount-low", label: "Lowest amount" },
];

export function sortItems<T>(
  items: T[],
  sort: SortOption,
  getName: (item: T) => string,
  getAmount: (item: T) => number
): T[] {
  const sorted = [...items];
  switch (sort) {
    case "az":
      sorted.sort((a, b) => getName(a).localeCompare(getName(b)));
      break;
    case "za":
      sorted.sort((a, b) => getName(b).localeCompare(getName(a)));
      break;
    case "amount-high":
      sorted.sort((a, b) => getAmount(b) - getAmount(a));
      break;
    case "amount-low":
      sorted.sort((a, b) => getAmount(a) - getAmount(b));
      break;
  }
  return sorted;
}
