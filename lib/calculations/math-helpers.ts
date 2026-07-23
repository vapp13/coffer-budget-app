/** Excel-style MEDIAN of exactly three numbers, used to clamp a value into a band. */
export function median3(a: number, b: number, c: number): number {
  return [a, b, c].sort((x, y) => x - y)[1] as number;
}

/** Round to 2 decimal places using standard "round half up" (matches Excel ROUND). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const WEEKS_PER_YEAR = 52;
export const WORKING_DAYS_PER_YEAR = 52 * 5;
export const WORKING_HOURS_PER_YEAR = 52 * 5 * 7.5;
