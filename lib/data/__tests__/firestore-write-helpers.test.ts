import { describe, it, expect } from "vitest";
import { stripUndefined, toUpdatePayload } from "@/lib/data/firestore-write-helpers";
import { categorySchema } from "@/lib/validation/category";

describe("stripUndefined", () => {
  it("removes keys with undefined values entirely (addDoc/setDoc would otherwise throw)", () => {
    const result = stripUndefined({ name: "Rent", monthlyBudget: undefined, color: "#000000" });
    expect(Object.prototype.hasOwnProperty.call(result, "monthlyBudget")).toBe(false);
    expect(result).toEqual({ name: "Rent", color: "#000000" });
  });

  it("leaves defined values (including 0 and empty string) untouched", () => {
    const result = stripUndefined({ a: 0, b: "", c: false, d: null });
    expect(result).toEqual({ a: 0, b: "", c: false, d: null });
  });

  it("reproduces the reported bug: a category form submitted with an empty budget field is now safe to write", () => {
    // This is exactly what a real form submits when the field is left blank —
    // the schema's preprocessing turns "" into undefined, but the *key*
    // still exists on the parsed object (this is what crashed addDoc).
    const parsed = categorySchema.parse({
      name: "Pet Care",
      group: "Personal",
      color: "#4C6FFF",
      monthlyBudget: "",
    });
    expect(Object.prototype.hasOwnProperty.call(parsed, "monthlyBudget")).toBe(true);
    expect(parsed.monthlyBudget).toBeUndefined();

    const safeToWrite = stripUndefined(parsed);
    expect(Object.prototype.hasOwnProperty.call(safeToWrite, "monthlyBudget")).toBe(false);
  });
});

describe("toUpdatePayload", () => {
  it("converts undefined values to Firestore's deleteField sentinel", () => {
    const result = toUpdatePayload({ name: "Rent", monthlyBudget: undefined });
    // deleteField() returns a FieldValue sentinel object, not literally
    // undefined — the important thing is it's no longer undefined.
    expect(result.monthlyBudget).not.toBeUndefined();
    expect(result.name).toBe("Rent");
  });

  it("leaves defined values untouched", () => {
    const result = toUpdatePayload({ name: "Rent", monthlyBudget: 500 });
    expect(result.monthlyBudget).toBe(500);
  });
});
