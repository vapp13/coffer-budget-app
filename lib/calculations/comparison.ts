export type Comparison = {
  current: number;
  previous: number;
  absoluteChange: number;
  /** null when there's nothing to compare against a percentage to (previous was £0). */
  percentChange: number | null;
};

export function compareValues(current: number, previous: number): Comparison {
  const absoluteChange = current - previous;
  const percentChange = previous === 0 ? null : (absoluteChange / previous) * 100;
  return { current, previous, absoluteChange, percentChange };
}
