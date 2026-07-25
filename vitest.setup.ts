import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library doesn't auto-cleanup outside of Jest's global
// afterEach hook, which Vitest doesn't provide automatically.
afterEach(() => {
  cleanup();
});
