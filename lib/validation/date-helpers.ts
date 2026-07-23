import { z } from "zod";

/**
 * HTML `<input type="date">` sends "" when cleared, not undefined.
 * `z.coerce.date()` turns "" into an Invalid Date, which fails validation
 * even on an `.optional()` field. This normalizes "" (and null) to
 * undefined first, so optional date fields are truly optional.
 */
export const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional()
);

/** Same normalization, but the field is still required. */
export const requiredDate = (message = "Date is required") =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.date({ required_error: message, invalid_type_error: message })
  );
